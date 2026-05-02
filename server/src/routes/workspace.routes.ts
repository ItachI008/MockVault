import { Router } from 'express';
import { Workspace, WorkspaceMember } from '../models/Workspace';
import User from '../models/User';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware';

const router = Router();
router.use(authMiddleware);

// Get user's workspaces
router.get('/', async (req: AuthRequest, res) => {
  try {
    const memberships = await WorkspaceMember.find({ userId: req.userId }).lean();
    const workspaceIds = memberships.map(m => m.workspaceId);
    const workspaces = await Workspace.find({ _id: { $in: workspaceIds } }).lean();
    
    res.json(workspaces.map(w => {
      const membership = memberships.find(m => m.workspaceId === w._id.toString());
      return {
        ...w,
        role: membership?.role
      };
    }));
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
});

// Get workspace members
router.get('/:id/members', async (req: AuthRequest, res) => {
  try {
    const membership = await WorkspaceMember.findOne({ workspaceId: req.params.id, userId: req.userId });
    if (!membership) return res.status(403).json({ message: 'Access denied.' });
    
    const members = await WorkspaceMember.find({ workspaceId: req.params.id }).sort({ invitedAt: -1 }).lean();
    res.json(members);
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
});

// Invite member
router.post('/:id/members', async (req: AuthRequest, res) => {
  try {
    const membership = await WorkspaceMember.findOne({ workspaceId: req.params.id, userId: req.userId });
    if (!membership || membership.role === 'viewer') return res.status(403).json({ message: 'Access denied.' });
    
    const { email, role } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required.' });
    
    const user = await User.findOne({ email: String(email).toLowerCase() });
    if (!user) return res.status(404).json({ message: 'User with this email not found. They must register first.' });
    
    const existing = await WorkspaceMember.findOne({ workspaceId: req.params.id, userId: user._id });
    if (existing) return res.status(409).json({ message: 'User is already a member.' });
    
    const newMember = await WorkspaceMember.create({
      workspaceId: req.params.id,
      userId: user._id,
      email: user.email,
      fullName: user.fullName,
      role: role || 'viewer'
    });
    
    res.status(201).json(newMember);
  } catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
});

// Update member role
router.patch('/:id/members/:memberId', async (req: AuthRequest, res) => {
  try {
    const membership = await WorkspaceMember.findOne({ workspaceId: req.params.id, userId: req.userId });
    if (!membership || membership.role !== 'owner') return res.status(403).json({ message: 'Only owners can update roles.' });
    
    const { role } = req.body;
    if (!['owner', 'editor', 'viewer'].includes(role)) return res.status(400).json({ message: 'Invalid role.' });
    
    const updated = await WorkspaceMember.findByIdAndUpdate(req.params.memberId, { role }, { new: true });
    if (!updated) return res.status(404).json({ message: 'Member not found.' });
    
    res.json(updated);
  } catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
});

// Remove member
router.delete('/:id/members/:memberId', async (req: AuthRequest, res) => {
  try {
    const membership = await WorkspaceMember.findOne({ workspaceId: req.params.id, userId: req.userId });
    if (!membership || membership.role !== 'owner') return res.status(403).json({ message: 'Only owners can remove members.' });
    
    const memberToRemove = await WorkspaceMember.findById(req.params.memberId);
    if (!memberToRemove) return res.status(404).json({ message: 'Member not found.' });
    
    if (memberToRemove.userId === req.userId) return res.status(400).json({ message: 'You cannot remove yourself.' });
    
    await WorkspaceMember.findByIdAndDelete(req.params.memberId);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
});

export default router;
