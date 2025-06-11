import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export interface User {
  id: number
  username: string
  password_hash: string
  email?: string
  role: string
  created_at: string
  last_login?: string
}

export interface Form {
  id: number
  external_id: string
  name: string
  description?: string
  fields: any[]
  background_color: string
  columns: {
    mobile: number
    tablet: number
    desktop: number
  }
  main_google_sheet_url?: string
  published: boolean
  version: number
  created_by: number
  created_at: string
  updated_at: string
}

export interface FormSubmission {
  id: number
  form_id: number
  data: any
  submitted_by?: number
  submitted_at: string
  device_info?: any
  location?: any
}

// User operations
export async function createUser(userData: {
  username: string
  password_hash: string
  email?: string
  role?: string
}) {
  const result = await sql`
    INSERT INTO users (username, password_hash, email, role)
    VALUES (${userData.username}, ${userData.password_hash}, ${userData.email || null}, ${userData.role || "user"})
    RETURNING *
  `
  return result[0] as User
}

export async function getUserByUsername(username: string) {
  const result = await sql`
    SELECT * FROM users WHERE username = ${username}
  `
  return result[0] as User | undefined
}

export async function updateUserLastLogin(userId: number) {
  await sql`
    UPDATE users 
    SET last_login = CURRENT_TIMESTAMP 
    WHERE id = ${userId}
  `
}

// Form operations
export async function createForm(formData: {
  external_id: string
  name: string
  description?: string
  fields: any[]
  background_color?: string
  columns?: any
  main_google_sheet_url?: string
  created_by: number
}) {
  const result = await sql`
    INSERT INTO forms (
      external_id, name, description, fields, background_color, 
      columns, main_google_sheet_url, created_by
    )
    VALUES (
      ${formData.external_id},
      ${formData.name},
      ${formData.description || null},
      ${JSON.stringify(formData.fields)},
      ${formData.background_color || "#ffffff"},
      ${JSON.stringify(formData.columns || { mobile: 1, tablet: 2, desktop: 3 })},
      ${formData.main_google_sheet_url || null},
      ${formData.created_by}
    )
    RETURNING *
  `
  return result[0] as Form
}

export async function updateForm(formId: number, updates: Partial<Form>) {
  const setClause = []
  const values = []

  if (updates.name !== undefined) {
    setClause.push(`name = $${values.length + 1}`)
    values.push(updates.name)
  }
  if (updates.description !== undefined) {
    setClause.push(`description = $${values.length + 1}`)
    values.push(updates.description)
  }
  if (updates.fields !== undefined) {
    setClause.push(`fields = $${values.length + 1}`)
    values.push(JSON.stringify(updates.fields))
  }
  if (updates.background_color !== undefined) {
    setClause.push(`background_color = $${values.length + 1}`)
    values.push(updates.background_color)
  }
  if (updates.columns !== undefined) {
    setClause.push(`columns = $${values.length + 1}`)
    values.push(JSON.stringify(updates.columns))
  }
  if (updates.main_google_sheet_url !== undefined) {
    setClause.push(`main_google_sheet_url = $${values.length + 1}`)
    values.push(updates.main_google_sheet_url)
  }
  if (updates.published !== undefined) {
    setClause.push(`published = $${values.length + 1}`)
    values.push(updates.published)
  }

  setClause.push(`updated_at = CURRENT_TIMESTAMP`)
  setClause.push(`version = version + 1`)

  const query = `
    UPDATE forms 
    SET ${setClause.join(", ")}
    WHERE id = $${values.length + 1}
    RETURNING *
  `
  values.push(formId)

  const result = await sql(query, ...values)
  return result[0] as Form
}

export async function getFormsByUser(userId: number, publishedOnly = false) {
  let query = `
    SELECT f.*, u.username as created_by_username
    FROM forms f
    LEFT JOIN users u ON f.created_by = u.id
    WHERE f.created_by = $1
  `

  if (publishedOnly) {
    query += ` AND f.published = true`
  }

  query += ` ORDER BY f.updated_at DESC`

  const result = await sql(query, userId)
  return result as (Form & { created_by_username: string })[]
}

export async function getPublishedForms() {
  const result = await sql`
    SELECT f.*, u.username as created_by_username
    FROM forms f
    LEFT JOIN users u ON f.created_by = u.id
    WHERE f.published = true
    ORDER BY f.updated_at DESC
  `
  return result as (Form & { created_by_username: string })[]
}

export async function getFormById(formId: number) {
  const result = await sql`
    SELECT f.*, u.username as created_by_username
    FROM forms f
    LEFT JOIN users u ON f.created_by = u.id
    WHERE f.id = ${formId}
  `
  return result[0] as (Form & { created_by_username: string }) | undefined
}

export async function getFormByExternalId(externalId: string) {
  const result = await sql`
    SELECT f.*, u.username as created_by_username
    FROM forms f
    LEFT JOIN users u ON f.created_by = u.id
    WHERE f.external_id = ${externalId}
  `
  return result[0] as (Form & { created_by_username: string }) | undefined
}

export async function deleteForm(formId: number) {
  await sql`DELETE FROM forms WHERE id = ${formId}`
}

// Form submission operations
export async function createFormSubmission(submissionData: {
  form_id: number
  data: any
  submitted_by?: number
  device_info?: any
  location?: any
}) {
  const result = await sql`
    INSERT INTO form_submissions (form_id, data, submitted_by, device_info, location)
    VALUES (
      ${submissionData.form_id},
      ${JSON.stringify(submissionData.data)},
      ${submissionData.submitted_by || null},
      ${JSON.stringify(submissionData.device_info || {})},
      ${JSON.stringify(submissionData.location || {})}
    )
    RETURNING *
  `
  return result[0] as FormSubmission
}

export async function getFormSubmissions(formId: number) {
  const result = await sql`
    SELECT fs.*, u.username as submitted_by_username
    FROM form_submissions fs
    LEFT JOIN users u ON fs.submitted_by = u.id
    WHERE fs.form_id = ${formId}
    ORDER BY fs.submitted_at DESC
  `
  return result as (FormSubmission & { submitted_by_username?: string })[]
}

// Draft operations
export async function saveDraft(formId: number, userId: number, draftData: any) {
  await sql`
    INSERT INTO form_drafts (form_id, user_id, draft_data)
    VALUES (${formId}, ${userId}, ${JSON.stringify(draftData)})
    ON CONFLICT (form_id, user_id) 
    DO UPDATE SET 
      draft_data = ${JSON.stringify(draftData)},
      last_modified = CURRENT_TIMESTAMP
  `
}

export async function getDraft(formId: number, userId: number) {
  const result = await sql`
    SELECT * FROM form_drafts 
    WHERE form_id = ${formId} AND user_id = ${userId}
  `
  return result[0]
}

export async function deleteDraft(formId: number, userId: number) {
  await sql`
    DELETE FROM form_drafts 
    WHERE form_id = ${formId} AND user_id = ${userId}
  `
}

// Collaboration tracking
export async function updateCollaboratorActivity(formId: number, userId: number, activity: string) {
  await sql`
    INSERT INTO form_collaborators (form_id, user_id, last_activity)
    VALUES (${formId}, ${userId}, ${activity})
    ON CONFLICT (form_id, user_id)
    DO UPDATE SET 
      last_activity = ${activity},
      last_active_at = CURRENT_TIMESTAMP
  `
}

export async function getActiveCollaborators(formId: number) {
  const result = await sql`
    SELECT fc.*, u.username
    FROM form_collaborators fc
    JOIN users u ON fc.user_id = u.id
    WHERE fc.form_id = ${formId} 
      AND fc.last_active_at > NOW() - INTERVAL '5 minutes'
    ORDER BY fc.last_active_at DESC
  `
  return result
}

// Change tracking
export async function logFormChange(formId: number, userId: number, changeType: string, changeData: any) {
  await sql`
    INSERT INTO form_changes (form_id, user_id, change_type, change_data)
    VALUES (${formId}, ${userId}, ${changeType}, ${JSON.stringify(changeData)})
  `
}

export async function getFormChanges(formId: number, limit = 50) {
  const result = await sql`
    SELECT fc.*, u.username
    FROM form_changes fc
    JOIN users u ON fc.user_id = u.id
    WHERE fc.form_id = ${formId}
    ORDER BY fc.created_at DESC
    LIMIT ${limit}
  `
  return result
}

// Sync queue operations
export async function addToSyncQueue(userId: number, actionType: string, actionData: any) {
  await sql`
    INSERT INTO sync_queue (user_id, action_type, action_data)
    VALUES (${userId}, ${actionType}, ${JSON.stringify(actionData)})
  `
}

export async function getUnprocessedSyncItems(userId: number) {
  const result = await sql`
    SELECT * FROM sync_queue 
    WHERE user_id = ${userId} AND processed = false
    ORDER BY created_at ASC
  `
  return result
}

export async function markSyncItemProcessed(syncId: number) {
  await sql`
    UPDATE sync_queue 
    SET processed = true, processed_at = CURRENT_TIMESTAMP
    WHERE id = ${syncId}
  `
}
