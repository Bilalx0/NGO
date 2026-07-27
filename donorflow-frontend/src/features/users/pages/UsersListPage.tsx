import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiPlus, FiSearch, FiX, FiTrash2, FiUserX, FiUserPlus } from 'react-icons/fi';
import { 
  useUsers, 
  useDeactivateUser, 
  useReactivateUser, 
  useUpdateUserRole, 
  useDeleteUser 
} from '../hooks/useUsers';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatDate } from '@/lib/utils';
import { useAuthStore } from '@/stores/authStore';

export function UsersListPage() {
  const { user: currentUser } = useAuthStore();
  const [searchInput, setSearchInput] = useState('');
  
  const { data: users, isLoading, error } = useUsers();
  const deactivateMutation = useDeactivateUser();
  const reactivateMutation = useReactivateUser();
  const updateRoleMutation = useUpdateUserRole();
  const deleteMutation = useDeleteUser();

  // Only ORG_ADMIN and SUPER_ADMIN can manage users
  const canManage = currentUser?.role === 'ORG_ADMIN' || currentUser?.role === 'SUPER_ADMIN';

  const handleDeactivate = (id: number) => {
    if (confirm('Are you sure you want to deactivate this user? They will lose access immediately, but can be reactivated later.')) {
      deactivateMutation.mutate(id);
    }
  };

  const handleReactivate = (id: number) => {
    if (confirm('Are you sure you want to reactivate this user? They will regain access immediately.')) {
      reactivateMutation.mutate(id);
    }
  };

  const handleDelete = (id: number, name: string) => {
    if (confirm(`⚠️ WARNING: Are you sure you want to PERMANENTLY delete "${name}"?\n\nThis action CANNOT be undone and will remove all their data from the system.`)) {
      deleteMutation.mutate(id);
    }
  };

  const handleRoleChange = (id: number, newRole: 'ORG_ADMIN' | 'STAFF') => {
    if (confirm(`Change this user's role to ${newRole}?`)) {
      updateRoleMutation.mutate({ id, role: newRole });
    }
  };

  // Ensure we always have an array to filter (handles both direct array and { data: [] } formats)
  const usersArray = Array.isArray(users) ? users : ((users as any)?.data || []);

  const filteredUsers = usersArray.filter((u: any) =>
    u.name.toLowerCase().includes(searchInput.toLowerCase()) ||
    u.email.toLowerCase().includes(searchInput.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-96 items-center justify-center">
        <p className="text-destructive">Failed to load users</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Team Members</h1>
          <p className="mt-1 text-muted-foreground">Manage access and roles for your organization</p>
        </div>
        {canManage && (
          <Link to="/users/new">
            <Button className="bg-primary hover:bg-primary-hover">
              <FiPlus className="mr-2 h-4 w-4" /> Add Team Member
            </Button>
          </Link>
        )}
      </div>

      {/* Search Filter */}
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="w-full space-y-2">
          <Label htmlFor="search">Search Team</Label>
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="search"
              type="text"
              placeholder="Search by name or email..."
              className="pl-9 pr-9"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => setSearchInput('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <FiX className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="rounded-xl border border-border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/50">
              <tr>
                <th className="px-6 py-3 text-left font-medium text-muted-foreground">Name</th>
                <th className="px-6 py-3 text-left font-medium text-muted-foreground">Email</th>
                <th className="px-6 py-3 text-left font-medium text-muted-foreground">Role</th>
                <th className="px-6 py-3 text-left font-medium text-muted-foreground">Joined</th>
                <th className="px-6 py-3 text-left font-medium text-muted-foreground">Status</th>
                <th className="px-6 py-3 text-right font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredUsers && filteredUsers.length > 0 ? (
                filteredUsers.map((u: any) => (
                  <tr key={u.id} className="transition hover:bg-muted/30">
                    <td className="px-6 py-4 font-medium text-foreground">{u.name}</td>
                    <td className="px-6 py-4 text-muted-foreground">{u.email}</td>
                    <td className="px-6 py-4">
                      {canManage && u.id !== currentUser?.id ? (
                        <select
                          value={u.role}
                          onChange={(e) => handleRoleChange(u.id, e.target.value as 'ORG_ADMIN' | 'STAFF')}
                          className="rounded border border-input bg-background px-2 py-1 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                          disabled={updateRoleMutation.isPending}
                        >
                          <option value="ORG_ADMIN">Org Admin</option>
                          <option value="STAFF">Staff</option>
                        </select>
                      ) : (
                        <span className="rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                          {u.role === 'ORG_ADMIN' ? 'Org Admin' : 'Staff'}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">{formatDate(u.createdAt)}</td>
                    <td className="px-6 py-4">
                      <span className={`rounded-full px-2 py-1 text-xs font-medium ${u.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {u.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {/* Smart Actions based on user status */}
                      {canManage && u.id !== currentUser?.id && (
                        <div className="flex justify-end gap-2">
                          {u.isActive ? (
                            // ACTIVE USER: Can be Deactivated or Deleted
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-orange-600 border-orange-200 hover:bg-orange-50 hover:text-orange-700"
                                onClick={() => handleDeactivate(u.id)}
                                disabled={deactivateMutation.isPending}
                              >
                                <FiUserX className="mr-1 h-4 w-4" /> Deactivate
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                                onClick={() => handleDelete(u.id, u.name)}
                                disabled={deleteMutation.isPending}
                              >
                                <FiTrash2 className="mr-1 h-4 w-4" /> Delete
                              </Button>
                            </>
                          ) : (
                            // INACTIVE USER: Can be Reactivated or Permanently Deleted
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-green-600 border-green-200 hover:bg-green-50 hover:text-green-700"
                                onClick={() => handleReactivate(u.id)}
                                disabled={reactivateMutation.isPending}
                              >
                                <FiUserPlus className="mr-1 h-4 w-4" /> Reactivate
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                                onClick={() => handleDelete(u.id, u.name)}
                                disabled={deleteMutation.isPending}
                              >
                                <FiTrash2 className="mr-1 h-4 w-4" /> Delete
                              </Button>
                            </>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                    {searchInput ? 'No users found matching your search.' : 'No team members found.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}