import { useAuth } from '../../contexts/authContext.context';

export default function HomePage() {
    const authContext = useAuth();
    const user = authContext.user;
    return (
        <div className='container' style={{marginTop: '90px'}}>
            Đây là Homepage! {user ? `Xin chào ${user.name}` : 'Vui lòng đăng nhập'}
        </div>
    )
}