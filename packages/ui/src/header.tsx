import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box, Stack } from '@mui/material';

export function Header() {
  return (
    <AppBar position="fixed">
      <Toolbar sx={{ justifyContent: 'space-between' }}>
        <Typography variant="h6">COEQWAL</Typography>
        
        <Stack direction="row" spacing={2}>
          <Button>EN | SP</Button>
          <Button>Get Data</Button>
          <Button>About COEQWAL</Button>
        </Stack>
      </Toolbar>
    </AppBar>
  );
} 