import { useState } from 'react';
import '../styles/sidebar.css'
import { Link } from 'react-router-dom';

const SideBar = () => {

    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <>
            <div
                className="sidebar"
                onMouseEnter={() => setSidebarOpen(true)} onMouseLeave={() => setSidebarOpen(false)}
                style={{
                    width: sidebarOpen ? '250px' : '50px',
                }}
            >
                <span className='itens-navigation'>
                    <div className="icon">
                        <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e3e3e3"><path d="M240-200h120v-240h240v240h120v-360L480-740 240-560v360Zm-80 80v-480l320-240 320 240v480H520v-240h-80v240H160Zm320-350Z" /></svg>
                    </div>
                    <p>
                        {sidebarOpen && 'Menu Inicial'}
                    </p>
                </span>
                <hr />
                <Link to={'/dashboard'} className='style-link'>
                    <span className='itens-navigation'>
                        <div className="icon">
                            <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e3e3e3">
                                <path d="M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h560q33 0 56.5 23.5T840-760v560q0 33-23.5 56.5T760-120H200Zm0-80h240v-560H200v560Zm320 0h240v-280H520v280Zm0-360h240v-200H520v200Z" />
                            </svg>
                        </div>
                        <p>
                            {sidebarOpen && 'Dashboard'}
                        </p>
                    </span>
                </Link>
                <Link to={'/simulation'} className='style-link'>
                    <span className="itens-navigation">
                        <div className="icon">
                            <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e3e3e3"><path d="M320-280v-23q0-44 44-70.5T480-400q72 0 116 26.5t44 70.5v23H320Zm103.5-183.5Q400-487 400-520t23.5-56.5Q447-600 480-600t56.5 23.5Q560-553 560-520t-23.5 56.5Q513-440 480-440t-56.5-23.5ZM120-592v306q14 13 34 22.5t46 14.5v-317q-22-5-42.5-11.5T120-592Zm720-1q-17 8-37 14.5T760-567v318q26-5 46-14.5t34-22.5v-307ZM280-154q-115-14-177.5-47T40-280v-400q0-57 113.5-88T480-799q213 0 326.5 31T920-680v400q0 46-62.5 79T680-154v-480q51-8 90.5-19.5T827-676q-43-17-147-30.5T480-720q-96 0-200 13.5T133-676q17 12 56.5 23t90.5 19v480ZM120-592v343-343Zm720-1v344-344Z" /></svg>
                        </div>
                        <p>
                            {sidebarOpen && 'Simulador'}
                        </p>
                    </span>
                </Link>
            </div>
        </>
    )
}

export default SideBar
