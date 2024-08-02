import express from 'express';
import multer from 'multer';
import multerS3 from "multer-s3"
import { s3 } from '../services/s3Service';
import client from '../utils/client'
import { ClerkExpressWithAuth } from '@clerk/clerk-sdk-node';

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

//simple get route to test my s3 bucket
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

router.get("/", (req, res) => {
    res.status(200).json({ message: "Hello world" });
});


//router.post('/upload', upload.single('file'), uploadFile);

export default router;