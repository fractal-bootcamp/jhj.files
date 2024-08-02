import express from 'express';
import multer from 'multer';
import multerS3 from "multer-s3"
import { s3 } from '../services/s3Service';
import client from '../utils/client'
import { ClerkExpressWithAuth } from '@clerk/clerk-sdk-node';
import { GetObjectCommand } from '@aws-sdk/client-s3';

console.log("File routes module loaded");

const router = express.Router();

router.use(ClerkExpressWithAuth())

router.use((req, res, next) => {
    console.log(`Incoming request: ${req.method} ${req.path}`);
    next();
});


// Add error handling to multer-s3 configuration
const upload = multer({
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB in bytes
    },
    storage: multerS3({
        s3: s3,
        bucket: 'jhj-fractal',
        metadata: function (req, file, cb) {
            cb(null, {
                fieldName: file.fieldname,
                contentType: file.mimetype
            });
        },
        key: function (req, file, cb) {
            cb(null, Date.now().toString() + '-' + file.originalname);
        }
    })
}).single('file');

// Modify the handleUpload middleware
const handleUpload = (req, res, next) => {
    console.log("handleUpload started");
    upload(req, res, function (err) {
        console.log("upload callback reached");
        if (err instanceof multer.MulterError) {
            console.error("Multer error:", err);
            return res.status(400).json({ error: 'File upload error', details: err.message });
        } else if (err) {
            console.error("Unknown error:", err);
            return res.status(500).json({ error: 'Unknown error', details: err.message });
        }
        console.log("handleUpload completed successfully");
        next();
    });
};

router.get("/", (req, res) => {
    res.status(200).json({ message: "Hello world" });
});

// POST ROUTE FOR PHOTOS
router.post('/photo', handleUpload, async (req, res, next) => {
    console.log("Request received:", req.file ? "File included" : "No file");
    console.log(req.auth)

    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        console.log("File details:", {
            originalname: req.file.originalname,
            size: req.file.size,
            mimetype: req.file.mimetype
        });

        const user = await client.user.findUnique({
            where: {
                clerkId: req.auth.userId
            }
        })

        if (!user) {
            return res.status(404).json({ error: 'User not found' })
        }

        // SAVE META - DATA TO DB VIA PRISMA CLIENT
        const fileMetadata = await client.file.create({
            data: {
                filename: req.file.originalname,
                s3Key: (req.file as any).key,
                s3Url: (req.file as any).location,
                mimetype: req.file.mimetype,
                size: req.file.size,
                userId: user.id
            },

        });

        console.log("File metadata saved:", fileMetadata);

        res.status(200).json({ message: 'Photo uploaded successfully', file: req.file });
    } catch (error) {
        console.error('Error uploading photo:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
});

//GET ROUTE TO TEST S3 BUCKET
router.get('/test', async (req, res, next) => {
    try {
        const params = {
            Bucket: 'jhj-fractal',
            Key: 'test-object.txt',
            Body: 'Hello, S3!'
        };

        const result = await s3.putObject(params);
        res.status(200).json({ message: 'Test object successfully uploaded to S3', result });
    } catch (error) {
        console.error('Error testing S3:', error);
        next(error); // Pass error to Express error handler
    }
});

//GET ALL ROUTE TO RETRIEVE USER FILE NAMES/KEYS

router.get("/get-all", async (req, res) => {
    try {
        if (!req.auth || !req.auth.userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const user = await client.user.findUnique({
            where: { clerkId: req.auth.userId }
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const files = await client.file.findMany({
            where: { userId: user.id },
            orderBy: { createdAt: 'desc' }
        });

        res.json(files);
    } catch (error) {
        console.error('Error fetching files:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET S3 FILES

router.get('/:s3Key', async (req, res) => {
    try {
        const user = await client.user.findUnique({
            where: { clerkId: req.auth.userId }
        });
        if (!user) {
            return res.status(404).json({ error: 'user not found' })
        }

        const fileMetadata = await client.file.findFirst({
            where: {
                userId: user.id,
                s3Key: req.params.s3Key
            }
        });

        if (!fileMetadata) {
            return res.status(404).json({ error: 'file not found' })
        }

        const getObjectParams = {
            Bucket: 'jhj-fractal',
            Key: req.params.s3Key
        };

        const command = new GetObjectCommand(getObjectParams);
        const s3Object = await s3.send(command);

        if (!s3Object) {
            return res.status(404).json({ error: 's3 file content not found' })
        }

        res.setHeader('Content-Type', s3Object.ContentType || ' application/octet-stream');
        res.setHeader('Content-Length', s3Object.ContentLength?.toString() || '');
        res.setHeader('Content-Disposition', `inline; filename="${fileMetadata.filename}"`);

        const readableStream = s3Object.Body as NodeJS.ReadableStream;
        if (readableStream) {
            readableStream.pipe(res);
        } else {
            res.status(500).json({ error: 'Unable to read file stream' });
        }
    } catch (error) {
        console.error('Error fetching file from S3:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
})


export default router;