import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, IconButton, Typography } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

const ShowImage = ({ imageUrl, open, handleClose }) => {
  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" responsive>
      <DialogTitle>
        Image Preview
        <IconButton
          edge="end"
          color="inherit"
          onClick={handleClose}
          aria-label="close"
          sx={{ position: 'absolute', right: 8, top: 8, color: (theme) => theme.palette.grey[500] }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary">
          <img src={imageUrl} alt="Medical Form" style={{ width: '100%', height: 'auto' }} />
          
        </Typography>
      </DialogContent>
      
    </Dialog>
  );
};

export default ShowImage;
