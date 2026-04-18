const express = require('express');
const router = express.Router();
const multer = require('multer');
const supabase = require('../config/supabase');
const { authenticateToken } = require('../middleware/auth.middleware');

// Memory storage — keep file in buffer, upload to Supabase Storage
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'), false);
        }
    }
});

// POST /api/upload/service-image
// Uploads a single image to Supabase Storage and returns the public URL
router.post('/service-image', authenticateToken, upload.single('image'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No image file provided' });
    }

    try {
        const ext = req.file.mimetype.split('/')[1] || 'jpg';
        const fileName = `service-images/${Date.now()}-${req.user.id}.${ext}`;

        const { data, error } = await supabase.storage
            .from('service-images')
            .upload(fileName, req.file.buffer, {
                contentType: req.file.mimetype,
                upsert: false,
            });

        if (error) throw error;

        // Get public URL
        const { data: publicData } = supabase.storage
            .from('service-images')
            .getPublicUrl(fileName);

        res.json({ url: publicData.publicUrl });
    } catch (error) {
        console.error('Image upload error:', error);
        res.status(500).json({ error: error.message || 'Image upload failed' });
    }
});

// Multer error handler
router.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        return res.status(400).json({ error: `Upload error: ${err.message}` });
    }
    if (err) {
        return res.status(400).json({ error: err.message });
    }
    next();
});

module.exports = router;
