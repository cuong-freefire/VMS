import { Link } from "react-router-dom"
import { Shrimp } from 'lucide-react';
import { useAuth } from "../../contexts/authContext.context";
import { useState } from "react";

export default function Navbar() {
    const authContext = useAuth()
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const handleLogout = async () => {
        if (isLoggingOut) return;
        setIsLoggingOut(true);
        await authContext.logout();
    };

    const navItem = [
        { name: 'HomePage', icon: '', link: '/' },
        { name: 'Draft', icon: '', link: '/' },
        { name: 'Draft', icon: '', link: '/' },
        { name: 'Draft', icon: '', link: '/' },
    ]

    const authItem = [
        { name: 'Sign In', icon: '', link: '/login' },
        { name: 'Sign Up', icon: '', link: '/register' },
    ]

    return (
        <div className="container-fluid bg-dark fixed-top">
            <div className="row">
                <div className="col-3">
                    <div className="py-3 text-light">
                        <Shrimp /><span className="fw-bold fs-4 mx-2">VSM</span>
                    </div>
                </div>
                <div className="col-6">
                    <ul className="list-unstyled d-flex justify-content-center py-3 gap-3 mb-0">
                        {navItem?.map(item => {
                            return (
                                <Link to={item.link} className="text-decoration-none text-light">
                                    <li>{item.name}</li>
                                </Link>
                            )
                        })}
                    </ul>
                </div>
                <div className="col-3">
                    {
                        authContext?.isAuthenticated ?
                            <div className="py-3 d-flex align-items-center gap-2">
                                <p className="text-success mb-0">Xin chào {authContext.user.name}</p>
                                <button
                                    className="btn btn-outline-danger btn-sm"
                                    onClick={handleLogout}
                                    disabled={isLoggingOut}
                                >
                                    {isLoggingOut ? 'Đang đăng xuất...' : 'Đăng xuất'}
                                </button>
                            </div>
                            :
                            <ul className="list-unstyled d-flex justify-content-center py-3 gap-3 mb-0">
                                {authItem?.map(item => {
                                    return (
                                        <Link to={item.link} className="text-decoration-none text-light">
                                            <li>{item.name}</li>
                                        </Link>
                                    )
                                })}
                            </ul>
                    }
                </div>
            </div>
        </div>
    )
}