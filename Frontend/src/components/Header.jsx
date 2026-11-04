import React from 'react'
import '../styles/header.css'

const Header = () => {
    return (
        <>
            <div className="header">
                <div className='div-logo'>
                    <div className='logo'>ES</div>
                    <div>
                        <p className='txt-logo-primary' style={{color: 'white'}}>Elev<p style={{color: '#00BFFF'}}>Sim</p></p>
                        <p className='txt-logo-second'>Laboratório de Segurança Operacional.</p>
                    </div>
                </div>
            </div>
        </>
    )
}

export default Header
