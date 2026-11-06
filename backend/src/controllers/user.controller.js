import { userStore } from '../store/userStore.js';

export const userController = {
    async getUsers(req, res) {
        try {
            const users = await userStore.getAllUsers();
            res.json(users);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }
};