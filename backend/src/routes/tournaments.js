const express = require('express');
const router = express.Router();
const { supabaseAdmin } = require('../lib/supabase');
const { authenticate, authorize } = require('../middleware/auth');

// GET /api/tournaments - List all tournaments (public)
router.get('/', async (req, res) => {
  try {
    const { state, format, status, limit = 20, page = 1 } = req.query;
    
    // Start query builder
    let query = supabaseAdmin.from('tournaments').select(`
      *,
      organizer:profiles!organizer_id(id, full_name),
      state:states(id, name)
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
    
    // Order by date
    query = query.order('start_date', { ascending: false });
    
    // Pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);
    
    const { data, error, count } = await query;
    
    if (error) throw error;
    
    return res.status(200).json({
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
    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch tournaments'
    });
  }
});

// GET /api/tournaments/:id - Get a single tournament (public)
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const { data, error } = await supabaseAdmin
      .from('tournaments')
      .select(`
        *,
        organizer:profiles!organizer_id(id, full_name),
        state:states(id, name),
        city:cities(id, name)
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
    
    // Get players registered for this tournament
    const { data: players, error: playersError } = await supabaseAdmin
      .from('tournament_players')
      .select(`
        player:players(
          id, first_name, last_name,
          ratings(format, rating, is_established)
        )
      `)
      .eq('tournament_id', id);
    
    if (playersError) throw playersError;
    
    // Get rounds and matches
    const { data: rounds, error: roundsError } = await supabaseAdmin
      .from('rounds')
      .select(`
        id, round_number, start_time, end_time,
        matches(
          id, white_player_id, black_player_id, result, board
        )
      `)
      .eq('tournament_id', id)
      .order('round_number');
    
    if (roundsError) throw roundsError;
    
    // Add players and rounds to the tournament data
    data.players = players.map(p => p.player);
    data.rounds = rounds;
    
    return res.status(200).json({
      status: 'success',
      data
    });
  } catch (error) {
    console.error('Error fetching tournament:', error);
    return res.status(500).json({
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
    
    // Create tournament
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
    
    return res.status(201).json({
      status: 'success',
      message: 'Tournament created successfully',
      data
    });
  } catch (error) {
    console.error('Error creating tournament:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to create tournament'
    });
  }
});

module.exports = router;
