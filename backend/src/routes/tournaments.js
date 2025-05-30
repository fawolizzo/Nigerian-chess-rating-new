const express = require('express');
const router = express.Router();
const { supabaseAdmin } = require('../lib/supabase');
const { authenticate, authorize } = require('../middleware/auth');

// GET /api/tournaments - List/search tournaments (public)
router.get('/', async (req, res) => {
  try {
    const { 
      state, 
      format, 
      status, 
      from_date, 
      to_date,
      limit = 20, 
      page = 1 
    } = req.query;
    
    // Start query builder
    let query = supabaseAdmin.from('tournaments').select(`
      *,
      organizer:profiles!organizer_id(id, full_name),
      state:states(id, name),
      city:cities(id, name),
      player_count:tournament_players(count)
    `);
    
    // Apply filters
    if (state) {
      query = query.eq('state_id', state);
    }
    
    if (format) {
      query = query.eq('format', format);
    }
    
    if (status) {
      query = query.eq('status', status);
    }
    
    if (from_date) {
      query = query.gte('start_date', from_date);
    }
    
    if (to_date) {
      query = query.lte('end_date', to_date);
    }
    
    // Order by date
    query = query.order('start_date', { ascending: false });
    
    // Handle pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    
    query = query.range(from, to);
    
    const { data, error, count } = await query;
    
    if (error) throw error;
    
    res.json({
      status: 'success',
      data,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count
      }
    });
  } catch (error) {
    console.error('Error fetching tournaments:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch tournaments'
    });
  }
});

// GET /api/tournaments/:id - Get tournament details (public)
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const { data, error } = await supabaseAdmin
      .from('tournaments')
      .select(`
        *,
        organizer:profiles!organizer_id(id, full_name),
        state:states(id, name),
        city:cities(id, name),
        players:tournament_players(
          player:players(
            id, first_name, last_name,
            ratings(format, rating, is_established)
          )
        ),
        rounds(
          id, round_number, start_time, end_time,
          matches(
            id, white_player_id, black_player_id, result, board
          )
        )
      `)
      .eq('id', id)
      .single();
    
    if (error) throw error;
    
    if (!data) {
      return res.status(404).json({
        status: 'error',
        message: 'Tournament not found'
      });
    }
    
    res.json({
      status: 'success',
      data
    });
  } catch (error) {
    console.error('Error fetching tournament:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch tournament details'
    });
  }
});

// POST /api/tournaments - Create a new tournament (protected)
router.post('/', authenticate, authorize(['ORGANIZER', 'OFFICER', 'ADMIN']), async (req, res) => {
  try {
    const { 
      name, 
      description, 
      format, 
      state_id, 
      city_id, 
      venue,
      start_date, 
      end_date, 
      rounds 
    } = req.body;
    
    // Validate required fields
    if (!name || !format || !start_date || !end_date || !rounds) {
      return res.status(400).json({
        status: 'error',
        message: 'Missing required tournament fields'
      });
    }
    
    // Create the tournament
    const { data, error } = await supabaseAdmin
      .from('tournaments')
      .insert([
        { 
          name, 
          description, 
          format, 
          state_id, 
          city_id, 
          venue,
          start_date, 
          end_date, 
          rounds,
          organizer_id: req.user.id,
          status: req.userRole === 'OFFICER' || req.userRole === 'ADMIN' ? 'APPROVED' : 'CREATED'
        }
      ])
      .select()
      .single();
    
    if (error) throw error;
    
    res.status(201).json({
      status: 'success',
      message: 'Tournament created successfully',
      data
    });
  } catch (error) {
    console.error('Error creating tournament:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create tournament'
    });
  }
});

// Export the router
module.exports = router;
