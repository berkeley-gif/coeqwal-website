import { Box } from '@repo/ui/mui'
import React from 'react'

function StickyContainer({sectionID, stickyRollHeight, sectionRef, children}: {
    children: React.ReactNode
    stickyRollHeight: string
    sectionRef: React.RefObject<HTMLElement | null>
    sectionID: string
}) {
    return (
        <Box id={sectionID} tabIndex={-1} role="region">
            <Box ref={sectionRef} height={stickyRollHeight} width="100%" sx={{ position: "relative" }}>  
            </Box>

            <Box className='sticky-container'>
                {children}
            </Box>

        </Box>
    )
}

export default StickyContainer
