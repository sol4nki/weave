import { useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Header.css'
import Buttonblack from './Button';
import weaveLogo from '../assets/weave-black.png';

export default function Header() {
    const headerRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        const handleScroll = () => {
        if (!headerRef.current) return;
        
        if (window.scrollY > 100) {
            headerRef.current.classList.add('scrolled');
        } else {
            headerRef.current.classList.remove('scrolled');
        }
        };

        window.addEventListener('scroll', handleScroll);

        // Cleanup
        return () => {
        window.removeEventListener('scroll', handleScroll);
        };
    }, []);

    return (
        <>
            <div className="header" ref={headerRef}>
                <div className="logo">
                    <img src={weaveLogo} alt="Logo" />
                    <h3 className="title">weave</h3>
                </div>
                <nav className="links">
                    {/* <a href="#home">Home</a> */}
                    <Link to="/">Home</Link>
                    <Link to="/guide">Guide</Link>
                    <Buttonblack text="Try Demo" onClick={() => navigate('/demo')} />
                </nav>
            </div>
        </>
  )

}
