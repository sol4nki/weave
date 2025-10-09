import { useEffect, useRef } from 'react';
import './Header.css'
import Buttonblack from './Button';

export default function Header() {
    const headerRef = useRef(null);

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
                    <img src="/weave-black.png" alt="Weave Logo" />
                    <h3 className="title">weave</h3>
                </div>
                <nav className="links">
                    {/* <a href="#home">Home</a> */}
                    <a href="#share">Home</a>
                    <a href="#share">Guide</a>
                    <Buttonblack text="Try Demo" onClick={() => alert('share/recieve clicked')} />
                </nav>
            </div>
        </>
  )

}
