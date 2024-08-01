import express from 'express';
import multer from 'multer';
import multerS3 from "multer-s3"
import { s3 } from '../services/s3Service';
import client from '../utils/client'

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


export async function uploadFile(req: Request, res: Response) {
    //upload metadata through prisma client after upload function completes and provide response
}


//simple get route to test my s3 bucket
router.get('/test', async (req, res) => {
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
        res.status(500).json({ error: 'Failed to test S3 connection' });
    }
});

router.get("/", (req, res) => {
    res.status(200).json({ message: "Hello world" });
});


//router.post('/upload', upload.single('file'), uploadFile);

export default router;