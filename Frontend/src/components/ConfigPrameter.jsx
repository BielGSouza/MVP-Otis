import React, { useState } from 'react'
import OverweightParam from './parameters/OverweightParam';

const ConfigPrameter = () => {

    const [parameter, setParameter] = useState(0);

  return (
    <>
      <OverweightParam />
    </>
  )
}

export default ConfigPrameter
