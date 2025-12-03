<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class AdminUserController extends Controller
{
    /**
     * Display a listing of the users.
     */
    public function index(): Response
    {
        return Inertia::render('admin/Users', [
            'users' => User::select('id', 'name', 'email', 'created_at', 'is_admin')
                ->orderBy('created_at', 'desc')
                ->get()
        ]);
    }

    /**
     * Remove the specified user from storage.
     */
    public function destroy(User $user): RedirectResponse
    {
        if ($user->id === auth()->id()) {
            return back()->withErrors(['message' => 'You cannot delete your own account.']);
        }

        $user->delete();

        return back()->with('success', 'User deleted successfully.');
    }
}
