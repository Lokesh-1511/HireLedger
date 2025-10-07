import { Router } from 'express';
import { login } from '../services/authService.js';

const router = Router();

router.post('/login', (req,res)=> {
  const { email, password } = req.body||{};
  const result = login(email, password);
  if(!result) return res.status(401).json({ success:false, error:'Invalid credentials' });
  res.json({ success:true, data: result });
});

export default router;
