import { useSelector } from 'react-redux';
import { useEffect } from 'react';
import { FaTimes } from 'react-icons/fa';
import Auth from '../pages/Auth.jsx';

function AuthModel({ onClose }) {

    const { userData } = useSelector((state) => state.user);

    useEffect(() => {
        if (userData) {
            onClose();
        }
        
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [onClose, userData]);

    return (
        <div 
            className='fixed inset-0 z-[999] bg-black/60 backdrop-blur-md overflow-y-auto'
            onClick={onClose}
        >
            <div className='min-h-screen flex items-center justify-center p-4 py-16 sm:p-6 md:p-10'>
                
                <div 
                    className='relative w-full max-w-[1200px] mx-auto animate-in fade-in zoom-in duration-300'
                    onClick={(e) => e.stopPropagation()}
                >
                    <button
                        onClick={onClose}
                        className='absolute z-[1000] -top-12 right-0 md:-right-4 text-gray-300 hover:text-white p-2 hover:bg-white/20 rounded-full transition-all'
                        title="Close"
                    >
                        <FaTimes size={26} />
                    </button>

                    <Auth isModel={true} />
                </div>

            </div>
        </div>
    );
}

export default AuthModel;