import express from 'express';
import { 
  createUser, 
  getAllUsers, 
  getUserById, 
  updateUser, 
  deleteUser, 
  authenticateUser,
  changePassword 
} from '../controllers/userController.js';
import { protectRoute, verifyUserType } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/login', authenticateUser);

router.post('/register', createUser);
router.use(protectRoute);

router.get('/', verifyUserType('admin'), getAllUsers);
router.get('/:id', getUserById);
router.put('/:id', verifyUserType('admin'), updateUser);
router.delete('/:id', verifyUserType('admin'), deleteUser);

export default router;
