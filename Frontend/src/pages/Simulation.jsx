import React, { useState } from 'react'
import '../styles/simulation.css'
import SideBar from '../components/SideBar'
import Header from '../components/Header'
import ElevatorIcon from '../components/icons/ElevatorIcon'
import ConfigPrameter from '../components/ConfigPrameter'

const Simulation = () => {

    let situatios = [
        {
            "id": 1,
            "icon": ElevatorIcon,
            "title": "Sobrecarga",
            "description": "Verifica a reação do elevador quando está sobrecarregado"
        },
        {
            "id": 2,
            "icon": "",
            "title": "",
            "description": ""
        },
        {
            "id": 3,
            "icon": "",
            "title": "",
            "description": ""
        },
        {
            "id": 4,
            "icon": "",
            "title": "",
            "description": ""
        },
        {
            "id": 5,
            "icon": "",
            "title": "",
            "description": ""
        },
        {
            "id": 6,
            "icon": "",
            "title": "",
            "description": ""
        }
    ]

    const [selectedSituation, setSelectedSituation] = useState(() => {
        const saved = localStorage.getItem("selectedSituation");
        return saved ? Number(saved) : null;
    });

    return (
        <>
            <Header />
            <main>
                <SideBar />
                <div className='menu'>
                    <div className='txt-init-page'>
                        <p>Simulador</p>
                    </div>
                    <h1>Simule ambientes de usos.</h1>
                    <p>Crie ambientes simulando situações que pode ocorrer e analise os resultados.</p>

                    <div className="situation-zone">
                        <p className='txt-init-page'>Selecione o cenário</p>
                        <p>Qual a situação deseja simular?</p>
                        <div className='situations'>
                            {situatios.map((situation, index) => (
                                <div
                                    className={selectedSituation == situation.id ? "situation" : "situation off"}
                                    onClick={() => {
                                        setSelectedSituation(situation.id)
                                        localStorage.setItem("selectedSituation", situation.id)
                                    }}
                                >
                                    <div className='icon-situation'>{situation.icon}</div>
                                    <p className='title-card-situation'>{situation.title}</p>
                                    <p className='txt-card-situation'>{situation.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className='simulation-zone'>
                        <div className="parameters-zone">
                            <p className='txt-init-page'>Parâmetros</p>
                            <h3 className='title-parameter'>Configurações do teste</h3>
                            <hr />
                            <ConfigPrameter />
                        </div>
                    </div>
                </div>
            </main>
        </>
    )
}

export default Simulation
