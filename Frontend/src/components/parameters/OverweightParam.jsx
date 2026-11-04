import React from 'react'
import ElevatorIcon from '../icons/ElevatorIcon'
import '../../styles/OverweightParam.css'

const OverweightParam = () => {
    return (
        <div className='body-param'>
            <div className='head-param'>
                <p className='title-param'>Sobrecarga</p>
                <p className='txt-param'>Configure os itens abaixo para realizar os testes.</p>
            </div>
            <div className='input-param-zone'>
                <label htmlFor="weight-capacit" className='label-param'>
                    Capacidade (Kg)
                    <input
                        type="number"
                        name="weight-capacit"
                        id="weight-capacit"
                        className='input-param'
                    />
                </label>
                <label htmlFor="weight-aplication" className='label-param'>
                    Carga aplicada (Kg)
                    <input
                        type="number"
                        name="weight-aplication"
                        id="weight-aplication"
                        className='input-param'
                    />
                </label>
            </div>
        </div>
    )
}

export default OverweightParam
