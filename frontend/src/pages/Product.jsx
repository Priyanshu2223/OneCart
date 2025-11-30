import React, { useContext } from 'react'
import LatestCollection from '../component/LatestCollection'
import BestSeller from '../component/BestSeller'
import { userDataContext } from '../context/UserContext'

function Product() {

  const { userData } = useContext(userDataContext);

  return (
    <div className='w-[100vw] min-h-[100vh] bg-gradient-to-l from-[#141414] to-[#0c2025] flex items-center justify-start flex-col py-[20px]'>

      {/* If NOT logged in → show message instead of breaking the page */}
      {!userData && (
        <div className="text-white text-[20px] my-[50px]">
          🔒 Please login to view the product collection.
        </div>
      )}

      {/* When logged in → load original components */}
      {userData && (
        <>
          <div className='w-[100%] min-h-[70px] flex items-center justify-center gap-[10px] flex-col'>
            <LatestCollection />
          </div>

          <div className='w-[100%] min-h-[70px] flex items-center justify-center gap-[10px] flex-col'>
            <BestSeller />
          </div>
        </>
      )}

    </div>
  )
}

export default Product
