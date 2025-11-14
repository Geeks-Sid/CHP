
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from '@/components/ui/use-toast';
import { apiClient, ApiClientError } from '@/lib/api-client';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  EditIcon,
  SearchIcon,
  TrashIcon,
  UserPlusIcon
} from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

interface BackendUser {
  user_id: string;
  username: string;
  email: string;
  active: boolean;
  roles: string[];
  created_at: string;
  updated_at: string;
}

interface UserListResponse {
  items: BackendUser[];
  nextCursor?: string;
}

const createUserSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(12, 'Password must be at least 12 characters'),
  role_ids: z.array(z.string()).min(1, 'At least one role is required'),
});

const updateUserSchema = z.object({
  email: z.string().email('Invalid email address').optional(),
  password: z.string().min(12, 'Password must be at least 12 characters').optional(),
  role_ids: z.array(z.string()).optional(),
  active: z.boolean().optional(),
});

type CreateUserForm = z.infer<typeof createUserSchema>;
type UpdateUserForm = z.infer<typeof updateUserSchema>;

const UserManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [activeFilter, setActiveFilter] = useState('all');
  const [isCreateSheetOpen, setIsCreateSheetOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<BackendUser | null>(null);
  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch users
  const { data, isLoading, error } = useQuery<UserListResponse>({
    queryKey: ['users', searchTerm, roleFilter, activeFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (roleFilter !== 'all') params.append('role', roleFilter);
      if (activeFilter !== 'all') params.append('active', activeFilter === 'active' ? 'true' : 'false');
      params.append('limit', '50');

      const queryString = params.toString();
      return apiClient.get<UserListResponse>(`/users${queryString ? `?${queryString}` : ''}`);
    },
  });

  // Fetch roles
  const { data: rolesData } = useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      return apiClient.get<Array<{ role_id: number; role_name: string }>>('/users/roles');
    },
  });

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: async (data: CreateUserForm) => {
      return apiClient.post('/users', {
        username: data.username,
        email: data.email,
        password: data.password,
        role_ids: data.role_ids.map(id => parseInt(id, 10)),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setIsCreateSheetOpen(false);
      toast({
        title: 'User created',
        description: 'The user has been successfully created.',
      });
    },
    onError: (error: ApiClientError) => {
      toast({
        variant: 'destructive',
        title: 'Error creating user',
        description: error.message || 'Failed to create user',
      });
    },
  });

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: async ({ userId, data }: { userId: string; data: UpdateUserForm }) => {
      const updateData: any = {};
      if (data.email) updateData.email = data.email;
      if (data.password) updateData.password = data.password;
      if (data.role_ids) updateData.role_ids = data.role_ids.map(id => parseInt(id, 10));
      if (data.active !== undefined) updateData.active = data.active;
      return apiClient.patch(`/users/${userId}`, updateData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setIsEditSheetOpen(false);
      setEditingUser(null);
      toast({
        title: 'User updated',
        description: 'The user has been successfully updated.',
      });
    },
    onError: (error: ApiClientError) => {
      toast({
        variant: 'destructive',
        title: 'Error updating user',
        description: error.message || 'Failed to update user',
      });
    },
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      return apiClient.delete(`/users/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({
        title: 'User deleted',
        description: 'The user has been successfully deleted.',
      });
    },
    onError: (error: ApiClientError) => {
      toast({
        variant: 'destructive',
        title: 'Error deleting user',
        description: error.message || 'Failed to delete user',
      });
    },
  });

  const form = useForm<CreateUserForm>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      username: '',
      email: '',
      password: '',
      role_ids: [],
    },
  });

  const updateForm = useForm<UpdateUserForm>({
    resolver: zodResolver(updateUserSchema),
    defaultValues: {
      email: '',
      password: '',
      role_ids: [],
      active: true,
    },
  });

  const onSubmit = (data: CreateUserForm) => {
    createUserMutation.mutate(data);
  };

  const onUpdateSubmit = (data: UpdateUserForm) => {
    if (editingUser) {
      updateUserMutation.mutate({ userId: editingUser.user_id, data });
    }
  };

  const handleEditUser = (user: BackendUser) => {
    setEditingUser(user);
    updateForm.reset({
      email: user.email,
      password: '',
      role_ids: user.roles.map(role => {
        const roleObj = roles.find(r => r.role_name === role);
        return roleObj ? roleObj.role_id.toString() : '';
      }).filter(Boolean),
      active: user.active,
    });
    setIsEditSheetOpen(true);
  };

  const users = data?.items || [];
  const roles = rolesData || [];

  const getRoleDisplay = (roles: string[]) => {
    return roles.join(', ') || 'No roles';
  };

  const getStatusBadgeColor = (active: boolean) => {
    return active
      ? 'bg-green-100 text-green-800'
      : 'bg-gray-100 text-gray-800';
  };

  if (error) {
    return (
      <div className="container p-6 mx-auto">
        <Card>
          <CardContent className="pt-6">
            <p className="text-destructive">
              Error loading users: {error instanceof ApiClientError ? error.message : 'Unknown error'}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container p-6 mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-muted-foreground">Manage all system users, roles, and permissions</p>
        </div>
        <Sheet open={isCreateSheetOpen} onOpenChange={setIsCreateSheetOpen}>
          <SheetTrigger asChild>
            <Button>
              <UserPlusIcon className="mr-2 h-4 w-4" />
              Add New User
            </Button>
          </SheetTrigger>
          <SheetContent className="sm:max-w-lg">
            <SheetHeader>
              <SheetTitle>Add New User</SheetTitle>
              <SheetDescription>
                Create a new user account with specific role and permissions.
              </SheetDescription>
            </SheetHeader>
            <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="username" className="text-right">
                  Username
                </Label>
                <Input
                  id="username"
                  className="col-span-3"
                  {...form.register('username')}
                />
                {form.formState.errors.username && (
                  <span className="col-span-4 text-sm text-destructive">
                    {form.formState.errors.username.message}
                  </span>
                )}
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="email" className="text-right">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  className="col-span-3"
                  {...form.register('email')}
                />
                {form.formState.errors.email && (
                  <span className="col-span-4 text-sm text-destructive">
                    {form.formState.errors.email.message}
                  </span>
                )}
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="password" className="text-right">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  className="col-span-3"
                  {...form.register('password')}
                />
                {form.formState.errors.password && (
                  <span className="col-span-4 text-sm text-destructive">
                    {form.formState.errors.password.message}
                  </span>
                )}
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="roles" className="text-right">
                  Roles
                </Label>
                <Select
                  onValueChange={(value) => {
                    const currentRoles = form.getValues('role_ids');
                    if (!currentRoles.includes(value)) {
                      form.setValue('role_ids', [...currentRoles, value]);
                    }
                  }}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role.role_id} value={role.role_id.toString()}>
                        {role.role_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="col-span-4 flex flex-wrap gap-2 mt-2">
                  {form.watch('role_ids').map((roleId) => {
                    const role = roles.find(r => r.role_id.toString() === roleId);
                    return role ? (
                      <span
                        key={roleId}
                        className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm flex items-center gap-1"
                      >
                        {role.role_name}
                        <button
                          type="button"
                          onClick={() => {
                            const currentRoles = form.getValues('role_ids');
                            form.setValue('role_ids', currentRoles.filter(id => id !== roleId));
                          }}
                          className="ml-1"
                        >
                          ×
                        </button>
                      </span>
                    ) : null;
                  })}
                </div>
              </div>
              <div className="flex justify-end space-x-2 mt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateSheetOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={createUserMutation.isPending}>
                  {createUserMutation.isPending ? 'Creating...' : 'Create User'}
                </Button>
              </div>
            </form>
          </SheetContent>
        </Sheet>

        {/* Edit User Sheet */}
        <Sheet open={isEditSheetOpen} onOpenChange={setIsEditSheetOpen}>
          <SheetContent className="sm:max-w-lg">
            <SheetHeader>
              <SheetTitle>Edit User</SheetTitle>
              <SheetDescription>
                Update user account information and permissions.
              </SheetDescription>
            </SheetHeader>
            <form onSubmit={updateForm.handleSubmit(onUpdateSubmit)} className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-email" className="text-right">
                  Email
                </Label>
                <Input
                  id="edit-email"
                  type="email"
                  className="col-span-3"
                  {...updateForm.register('email')}
                />
                {updateForm.formState.errors.email && (
                  <span className="col-span-4 text-sm text-destructive">
                    {updateForm.formState.errors.email.message}
                  </span>
                )}
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-password" className="text-right">
                  Password
                </Label>
                <Input
                  id="edit-password"
                  type="password"
                  className="col-span-3"
                  placeholder="Leave blank to keep current"
                  {...updateForm.register('password')}
                />
                {updateForm.formState.errors.password && (
                  <span className="col-span-4 text-sm text-destructive">
                    {updateForm.formState.errors.password.message}
                  </span>
                )}
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-roles" className="text-right">
                  Roles
                </Label>
                <Select
                  onValueChange={(value) => {
                    const currentRoles = updateForm.getValues('role_ids') || [];
                    if (!currentRoles.includes(value)) {
                      updateForm.setValue('role_ids', [...currentRoles, value]);
                    }
                  }}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role.role_id} value={role.role_id.toString()}>
                        {role.role_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="col-span-4 flex flex-wrap gap-2 mt-2">
                  {updateForm.watch('role_ids')?.map((roleId) => {
                    const role = roles.find(r => r.role_id.toString() === roleId);
                    return role ? (
                      <span
                        key={roleId}
                        className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm flex items-center gap-1"
                      >
                        {role.role_name}
                        <button
                          type="button"
                          onClick={() => {
                            const currentRoles = updateForm.getValues('role_ids') || [];
                            updateForm.setValue('role_ids', currentRoles.filter(id => id !== roleId));
                          }}
                          className="ml-1"
                        >
                          ×
                        </button>
                      </span>
                    ) : null;
                  })}
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-active" className="text-right">
                  Active
                </Label>
                <Select
                  value={updateForm.watch('active') ? 'true' : 'false'}
                  onValueChange={(value) => updateForm.setValue('active', value === 'true')}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Active</SelectItem>
                    <SelectItem value="false">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end space-x-2 mt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsEditSheetOpen(false);
                    setEditingUser(null);
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={updateUserMutation.isPending}>
                  {updateUserMutation.isPending ? 'Updating...' : 'Update User'}
                </Button>
              </div>
            </form>
          </SheetContent>
        </Sheet>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>System Users</CardTitle>
          <CardDescription>Manage all users in the system</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row justify-between mb-6 space-y-4 md:space-y-0 md:space-x-4">
            <div className="relative w-full md:w-1/3">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search users..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex space-x-4">
              <div>
                <Label htmlFor="roleFilter" className="sr-only">Filter by Role</Label>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger id="roleFilter" className="w-[160px]">
                    <SelectValue placeholder="Filter by Role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    {roles.map((role) => (
                      <SelectItem key={role.role_id} value={role.role_name}>
                        {role.role_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="statusFilter" className="sr-only">Filter by Status</Label>
                <Select value={activeFilter} onValueChange={setActiveFilter}>
                  <SelectTrigger id="statusFilter" className="w-[160px]">
                    <SelectValue placeholder="Filter by Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-10">
              <p className="text-muted-foreground">Loading users...</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Username</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Roles</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-10">
                          <p className="text-muted-foreground">No users found</p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      users.map((user) => (
                        <TableRow key={user.user_id}>
                          <TableCell className="font-medium">{user.username}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {user.roles.map((role, idx) => (
                                <span
                                  key={idx}
                                  className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800"
                                >
                                  {role}
                                </span>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded-full text-xs ${getStatusBadgeColor(user.active)}`}>
                              {user.active ? 'Active' : 'Inactive'}
                            </span>
                          </TableCell>
                          <TableCell>
                            {new Date(user.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end space-x-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEditUser(user)}
                              >
                                <EditIcon className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => deleteUserMutation.mutate(user.user_id)}
                                disabled={deleteUserMutation.isPending}
                              >
                                <TrashIcon className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              <div className="flex items-center justify-between space-x-2 py-4">
                <div className="text-sm text-muted-foreground">
                  Showing <strong>{users.length}</strong> users
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UserManagement;
