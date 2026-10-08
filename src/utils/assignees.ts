/*
 * Who an action can be handed to.
 *
 * `role` on the account is the highest role it holds anywhere, so testing it
 * hid a Planner on one project behind a PM place on another: the account read
 * as an admin and dropped out of every assignee list, leaving "No users
 * available" on a project that plainly had people on it. The role held on the
 * project in question is what decides this.
 *
 * Planners run the work and Users own the actions handed to them, so both
 * belong. A PM is left out on purpose: they assign and override, and owning
 * the action as well would blur who is accountable for closing it.
 */
export interface AssignableUser {
  role: string;
  isSuperAdmin?: boolean;
  memberships?: { project: string; role: string; status?: string }[];
}

export const canBeAssigned = (
  user: AssignableUser,
  projectId?: string,
): boolean => {
  /* An owner reaches every project without being placed on one, which is not
     the same as being accountable for work on it. */
  if (user.isSuperAdmin) return false;

  /* A place still sitting in an inbox grants nothing, so it cannot carry an
     action either. */
  const taken = (user.memberships || []).filter((m) => m.status !== "pending");

  /* Accounts from before access was held per project have no rows to read, so
     the single role on the account is all there is to go on. */
  if (taken.length === 0) return ["planner", "user"].includes(user.role);

  const here = projectId
    ? taken.filter((m) => String(m.project) === String(projectId))
    : taken;

  return here.some((m) => m.role === "planner" || m.role === "user");
};
