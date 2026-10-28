import { useState } from 'react';
import '../styles/sidebar.css'

const SideBar = () => {

    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <>
            <div
                className="sidebar"
                onMouseEnter={() => setSidebarOpen(true)} onMouseLeave={() => setSidebarOpen(false)}
                style={{
                    width: sidebarOpen ? '250px' : '50px',
                    display: sidebarOpen ? 'block' : 'flex'
                }}
            >
                <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e3e3e3"><path d="M240-200h120v-240h240v240h120v-360L480-740 240-560v360Zm-80 80v-480l320-240 320 240v480H520v-240h-80v240H160Zm320-350Z"/></svg>
                <hr />
                <span className='itens-navigation'>
                    <div className="icon">
                        <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e3e3e3">
                            <path d="M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h560q33 0 56.5 23.5T840-760v560q0 33-23.5 56.5T760-120H200Zm0-80h240v-560H200v560Zm320 0h240v-280H520v280Zm0-360h240v-200H520v200Z" />
                        </svg>
                    </div>
                    <p
                        style={{
                            display: sidebarOpen ? 'block' : 'none'
                        }}
                    >
                        Dashboard
                    </p>
                </span>
            </div>
        </>
    )
}

export default SideBar
