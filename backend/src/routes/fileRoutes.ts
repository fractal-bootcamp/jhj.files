import express from 'express';
import multer from 'multer';
import multerS3 from "multer-s3"
import { s3 } from '../services/s3Service';
import client from '../utils/client'

interface AuthenticatedRequest extends express.Request {
    auth: {
        userId: string;
    }
}

const router = express.Router();
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
});


// POST ROUTE FOR PHOTOS
router.post('/photo', upload.single('file'), async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        //SAVE META - DATA TO DB VIA PRISMA CLIENT
        const fileMetadata = await client.file.create({
            data: {
                filename: req.file.originalname,
                s3Key: (req.file as any).key,
                s3Url: (req.file as any).location,
                mimetype: req.file.mimetype,
                size: req.file.size,
                userId: (req as AuthenticatedRequest).auth.userId,
            }
        });

        res.status(200).json({ message: 'Photo uploaded successfully', file: req.file });
    } catch (error) {
        console.error('Error uploading photo:', error);
        next(error); // Pass error to Express error handler
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