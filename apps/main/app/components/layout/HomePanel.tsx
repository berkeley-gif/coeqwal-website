import React from 'react'
import { Grid2, Typography, Box } from '@mui/material'
import Image from 'next/image'

const HomePanel = () => {
  return (
    <Box sx={{ height: '100vh', width: '100%', p: 16 }}>
      <Grid2 container spacing={16}>
        {/* Left side - Text content */}
        <Grid2 size={6}>
          <Typography variant="h1" sx={{ maxWidth: 500 }} gutterBottom>
            Californians are connected by their water.
          </Typography>
          <Typography variant="body1">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
          </Typography>
        </Grid2>
        
        {/* Right side - Hero image */}
        <Grid2 size={6} sx={{ position: 'relative' }}>
          <Image
            src="/images/hero.png"
            alt="Illustration of people living in community in a California landscape with mountains, meadows, forests, and rivers"
            width={1893}
            height={1584}
            style={{ 
              width: '100%',
              height: 'auto',
              objectFit: 'contain',
              objectPosition: 'center',
            }}
          />
        </Grid2>
      </Grid2>
    </Box>
  )
}

export default HomePanel