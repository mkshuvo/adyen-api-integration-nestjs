"use client";
import { List, ListItem, ListItemIcon, ListItemText, Tooltip } from '@mui/material';
import { CheckCircleOutline, ErrorOutline } from '@mui/icons-material';

interface ConfigItem {
  key: string;
  present: boolean;
  hint?: string;
}

export default function ConfigList({ items }: { items: ConfigItem[] }) {
  return (
    <List>
      {items.map((item) => (
        <ListItem key={item.key} dense>
          <ListItemIcon>
            {item.present ? (
              <CheckCircleOutline color="success" />
            ) : (
              <Tooltip title={item.hint || ''}>
                <ErrorOutline color="error" />
              </Tooltip>
            )}
          </ListItemIcon>
          <ListItemText primary={item.key} secondary={item.present ? 'Configured' : 'Missing'} />
        </ListItem>
      ))}
    </List>
  );
}
