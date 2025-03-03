import React from 'react';
import { SwipeableDrawer, Box, List, Divider, ListItem, ListItemButton, ListItemText, Button } from '@mui/material';
import { useMainAppTranslation } from '../../../i18n/useMainAppTranslation';

interface DrawerProps {
  open: boolean;
  onOpen: (event: React.KeyboardEvent | React.MouseEvent) => void;
  onClose: (event: React.KeyboardEvent | React.MouseEvent) => void;
}

const Drawer: React.FC<DrawerProps> = ({ open, onOpen, onClose }) => {
  const { t } = useMainAppTranslation();

  const drawerList = () => (
    <Box
      role="presentation"
      onClick={onClose}
      onKeyDown={onClose}
    >
      <List>
        {[
          { text: t("drawerLinks.howWaterMoves"), href: "#how-water-moves" },
          { text: t("drawerLinks.howWaterManaged"), href: "#how-water-managed" },
          { text: t("drawerLinks.calSim"), href: "#calsim" },
          { text: t("drawerLinks.climateChange"), href: "#climate-change" },
        ].map((item, index) => (
          <React.Fragment key={`${item.text}-${index}`}>
            <ListItem disablePadding>
              <ListItemButton component="a" href={item.href}>
                <ListItemText primary={item.text} />
              </ListItemButton>
            </ListItem>
            <Divider />
          </React.Fragment>
        ))}
      </List>
      <Button
        onClick={onClose}
        style={{ marginTop: '16px', width: '100%' }}
      >
        {t("drawerButton.close")}
      </Button>
    </Box>
  );

  return (
    <SwipeableDrawer
      anchor="right"
      open={open}
      onClose={onClose}
      onOpen={onOpen}
      slotProps={{
        backdrop: {
          invisible: true, // Disable backdrop darkening
        },
      }}
    >
      {drawerList()}
    </SwipeableDrawer>
  );
};

export default Drawer;