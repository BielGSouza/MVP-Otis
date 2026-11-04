import React from 'react'
import SideBar from '../components/SideBar'
import Header from '../components/Header'

const Dashboard = () => {
  return (
    <>
        <SideBar />
        <main>
          <Header />
          <div className="menu">
            <h2>Dashboard</h2>
          </div>
        </main>
    </>
  )
}

export default Dashboard
