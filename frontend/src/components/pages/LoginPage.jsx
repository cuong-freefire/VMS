import { useForm } from 'react-hook-form'
import { useAuth } from '../../contexts/authContext.context';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

export default function LoginPage() {
    const {
        register,
        handleSubmit
    } = useForm();

    const navigate = useNavigate();
    const authContext = useAuth();

    async function onSubmit(data) {
        try {
            const user = await authContext.login(data)
            if (user) {
                navigate('/', { replace: true })
            }
        }
        catch (err) {
            toast.error(err.message || 'Có lỗi xảy ra!', {
                autoClose: 7000
            })
        }
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)}>
            <div class="mb-3">
                <label for="exampleInputEmail1" class="form-label">Email address</label>
                <input {...register('email')} class="form-control" id="exampleInputEmail1" aria-describedby="emailHelp" required />
                <div id="emailHelp" class="form-text">We'll never share your email with anyone else.</div>
            </div>
            <div class="mb-3">
                <label for="exampleInputPassword1" class="form-label">Password</label>
                <input {...register('password')} type="password" class="form-control" id="exampleInputPassword1" required />
            </div>
            <button type="submit" class="btn btn-primary">Submit</button>
        </form>
    )
}