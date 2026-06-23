// Nơi cấu hình express 
// (Chỉ thêm vào các option cần thiết tuyệt đối không sửa logic, cấu trúc file này)
import dotenv from 'dotenv'; //process.env.BienMoiTruong
// Cấu hình env
dotenv.config();
import express from 'express';
import authRoutes from './routes/auth.routes.js'
import userRoutes from './routes/user.routes.js'
import cookieParser from 'cookie-parser';
import cors from 'cors'

const app = express();

// 1. Cấu hình phục vụ file tĩnh (public)
app.use(express.static('public'));
// 2. Cấu hình để express hiểu dữ liệu json từ frontend gửi về trong req.body.
app.use(express.json());
// 3. Cấu hình cookie-parser để server lấy được req.cookies từ frontend request
app.use(cookieParser());
// 4. Cấu hình cors để giao tiếp cross-origin giữa FE và BE.
app.use(cors(
    {
        "origin": `http://localhost:${process.env.PORT_FE}`,
        "methods": "GET,PUT,PATCH,POST,DELETE",
        "preflightContinue": false,
        credentials: true, //Thêm cookie
        "optionsSuccessStatus": 204
    }
))
// 5.Khai báo Routes
// 5.1 authRoutes
app.use('/auth', authRoutes);
app.use('/user', userRoutes);

export default app;