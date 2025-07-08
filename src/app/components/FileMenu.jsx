import { useState, useEffect, useContext } from 'react'
import { PDFContext } from '../PDFEditor'

export default function FileMenu() {
    const pdf = useContext(PDFContext)
    const [showModal, setShowModal] = useState(false)
    
    const handleOpenFile = () => {
        setShowModal(false)
    }
    
    const handleClickOutside = (e) => {
        if (e.target.closest('.file-menu')) return
        setShowModal(false)
    }
    
    useEffect(() => {
        if (showModal) {
            document.addEventListener('click', handleClickOutside)
            return () => document.removeEventListener('click', handleClickOutside)
        }
    }, [showModal])
    
    return (
        <div className="relative w-full bg-gray-900 text-sm text-white p-1 flex items-center justify-between">
            <div className="relative file-menu">
                <button 
                    className="px-4 py-2 cursor-pointer "
                    onClick={() => setShowModal(!showModal)}
                >
                    File
                </button>
                
                {showModal && (
                    <div className="absolute top-full left-0 mt-1 bg-white text-gray-800 rounded shadow-lg border min-w-[200px] z-60">
                        <div className="py-1">
                            <button 
                                className="w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors"
                                onClick={handleOpenFile}
                            >
                                Open File
                            </button>
                            <button className="w-full text-left px-4 py-2 text-gray-400 cursor-not-allowed" disabled>
                                Create File
                            </button>
                            <button className="w-full text-left px-4 py-2 text-gray-400 cursor-not-allowed" disabled>
                                Print
                            </button>
                        </div>
                    </div>
                )}
            </div>
            
            <div className="text-sm font-semibold">
                {pdf && pdf.metadata.filename? pdf.metadata.filename : 'PDF Editor'}
            </div>
            
            <div className="w-16"></div> {/* Spacer to center the title */}
        </div>
    )
}