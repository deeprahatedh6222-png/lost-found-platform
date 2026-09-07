const crypto = require('crypto');
const supabase = require('../config/supabase');

// ── Helper: upload image to Supabase Storage ──────────────────
const uploadImage = async (file) => {
  const ext = file.originalname.split('.').pop().toLowerCase();
  const filename = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}.${ext}`;

  const { error } = await supabase.storage
    .from('item-images')
    .upload(filename, file.buffer, {
      contentType: file.mimetype,
      upsert: false
    });

  if (error) throw error;

  const { data } = supabase.storage.from('item-images').getPublicUrl(filename);
  return data.publicUrl;
};

// ── Helper: delete image from Supabase Storage ────────────────
const deleteImage = async (imageUrl) => {
  if (!imageUrl) return;
  try {
    // Extract filename from the public URL
    const parts = imageUrl.split('/item-images/');
    if (parts.length < 2) return;
    const filename = parts[1];
    await supabase.storage.from('item-images').remove([filename]);
  } catch (err) {
    console.error('Failed to delete image:', err.message);
  }
};

// ── CREATE ────────────────────────────────────────────────────
const createItem = async (req, res, next) => {
  try {
    const { itemType, title, description, category, location, eventDate } = req.body;

    if (!itemType || !title || !description || !location || !eventDate) {
      return res.status(400).json({ message: 'Type, title, description, location and date are required' });
    }

    let imageUrl = '';
    if (req.file) {
      imageUrl = await uploadImage(req.file);
    }

    const { data: item, error } = await supabase
      .from('items')
      .insert({
        user_id: req.user.id,
        item_type: itemType,
        title,
        description,
        category: category || 'Other',
        location,
        event_date: eventDate,
        status: 'open',
        image_url: imageUrl
      })
      .select('*, user:users!items_user_id_fkey(id, name)')
      .single();

    if (error) {
      if (imageUrl) await deleteImage(imageUrl);
      throw error;
    }

    res.status(201).json(item);
  } catch (error) {
    next(error);
  }
};

// ── LIST (with search, filter, pagination) ────────────────────
const getItems = async (req, res, next) => {
  try {
    const {
      search = '',
      itemType,
      category,
      status,
      location,
      page = 1,
      limit = 12
    } = req.query;

    const safePage = Math.max(Number(page) || 1, 1);
    const safeLimit = Math.min(Math.max(Number(limit) || 12, 1), 50);
    const from = (safePage - 1) * safeLimit;
    const to = from + safeLimit - 1;

    let query = supabase
      .from('items')
      .select('*, user:users!items_user_id_fkey(id, name)', { count: 'exact' });

    if (itemType && itemType !== 'all') query = query.eq('item_type', itemType);
    if (category && category !== 'all') query = query.eq('category', category);
    if (status && status !== 'all') query = query.eq('status', status);
    if (location) query = query.ilike('location', `%${location}%`);

    if (search.trim()) {
      const s = `%${search.trim()}%`;
      query = query.or(`title.ilike.${s},description.ilike.${s},location.ilike.${s}`);
    }

    query = query.order('created_at', { ascending: false }).range(from, to);

    const { data: items, count, error } = await query;
    if (error) throw error;

    res.json({
      items: items || [],
      pagination: {
        page: safePage,
        limit: safeLimit,
        total: count || 0,
        pages: Math.ceil((count || 0) / safeLimit)
      }
    });
  } catch (error) {
    next(error);
  }
};

// ── GET BY ID ─────────────────────────────────────────────────
const getItemById = async (req, res, next) => {
  try {
    const { data: item, error } = await supabase
      .from('items')
      .select('*, user:users!items_user_id_fkey(id, name)')
      .eq('id', req.params.id)
      .single();

    if (error || !item) return res.status(404).json({ message: 'Item report not found' });
    res.json(item);
  } catch (error) {
    next(error);
  }
};

// ── GET MY ITEMS ──────────────────────────────────────────────
const getMyItems = async (req, res, next) => {
  try {
    const { data: items, error } = await supabase
      .from('items')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(items || []);
  } catch (error) {
    next(error);
  }
};

// ── UPDATE ────────────────────────────────────────────────────
const updateItem = async (req, res, next) => {
  try {
    const { data: item, error: fetchErr } = await supabase
      .from('items')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (fetchErr || !item) {
      return res.status(404).json({ message: 'Item report not found' });
    }

    if (item.user_id !== req.user.id) {
      return res.status(403).json({ message: 'You can update only your own reports' });
    }

    const updates = {};
    const allowed = {
      itemType: 'item_type',
      title: 'title',
      description: 'description',
      category: 'category',
      location: 'location',
      eventDate: 'event_date'
    };

    Object.entries(allowed).forEach(([bodyKey, dbKey]) => {
      if (req.body[bodyKey] !== undefined) updates[dbKey] = req.body[bodyKey];
    });

    if (req.file) {
      await deleteImage(item.image_url);
      updates.image_url = await uploadImage(req.file);
    }

    const { data: updated, error } = await supabase
      .from('items')
      .update(updates)
      .eq('id', req.params.id)
      .select('*, user:users!items_user_id_fkey(id, name)')
      .single();

    if (error) throw error;
    res.json(updated);
  } catch (error) {
    next(error);
  }
};

// ── CHANGE STATUS ─────────────────────────────────────────────
const changeStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['open', 'claimed', 'resolved'].includes(status)) {
      return res.status(400).json({ message: 'Status must be open, claimed or resolved' });
    }

    const { data: item, error: fetchErr } = await supabase
      .from('items')
      .select('id, user_id')
      .eq('id', req.params.id)
      .single();

    if (fetchErr || !item) return res.status(404).json({ message: 'Item report not found' });
    if (item.user_id !== req.user.id) {
      return res.status(403).json({ message: 'You can change only your own report status' });
    }

    const { data: updated, error } = await supabase
      .from('items')
      .update({ status })
      .eq('id', req.params.id)
      .select('*')
      .single();

    if (error) throw error;
    res.json(updated);
  } catch (error) {
    next(error);
  }
};

// ── DELETE ────────────────────────────────────────────────────
const deleteItem = async (req, res, next) => {
  try {
    const { data: item, error: fetchErr } = await supabase
      .from('items')
      .select('id, user_id, image_url')
      .eq('id', req.params.id)
      .single();

    if (fetchErr || !item) return res.status(404).json({ message: 'Item report not found' });
    if (item.user_id !== req.user.id) {
      return res.status(403).json({ message: 'You can delete only your own reports' });
    }

    await deleteImage(item.image_url);

    // Delete associated claims first (cascade should handle this, but be explicit)
    await supabase.from('claims').delete().eq('item_id', item.id);

    const { error } = await supabase
      .from('items')
      .delete()
      .eq('id', item.id);

    if (error) throw error;
    res.json({ message: 'Report deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createItem,
  getItems,
  getItemById,
  getMyItems,
  updateItem,
  changeStatus,
  deleteItem
};
