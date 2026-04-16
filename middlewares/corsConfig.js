const cors = require('cors');

const allowedOrigins = [
    'https://fc-scout-pro.onrender.com', 
    'http://localhost:3000',             
    'http://127.0.0.1:5500',
    'http://localhost:5500', 
    'http://127.0.0.1:3000'  
];

const corsOptions = {
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('CORS Politikası: Erişim izni yok!'));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true 
};

// KRİTİK NOKTA: Burayı unutma!
module.exports = cors(corsOptions);