const express = require('express');
const router = express.Router();
const { supabaseAdmin } = require('../lib/supabase');
const { authenticate, authorize } = require('../middleware/auth');

// GET /api/players - List all players (public)
router.get('/', async (req, res) => {
  try {
    const { name, state, limit = 20, page = 1 } = req.query;
    
    // Start query builder
    let query = supabaseAdmin.from('players').select(`
      *,
      state:states(id, name),
      ratings(format, rating, is_established)
    `);
    
    // Apply filters
    if (name) {
      query = query.or(`first_name.ilike.%${name}%,last_name.ilike.%${name}%`);
    }
    
    if (state) {
      query = query.eq('state_id', state);
    }
    
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
    console.error('Error fetching players:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch players'
    });
  }
});

// GET /api/players/:id - Get a single player (public)
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const { data, error } = await supabaseAdmin
      .from('players')
      .select(`
        *,
        state:states(id, name),
        city:cities(id, name),
        ratings(format, rating, games_played, is_established),
        titles:player_titles(
          title_code,
          verified,
          title:titles(code, name)
        )
      `)
      .eq('id', id)
      .single();
    
    if (error) throw error;
    
    if (!data) {
      return res.status(404).json({
        status: 'error',
        message: 'Player not found'
      });
    }
    
    return res.status(200).json({
      status: 'success',
      data
    });
  } catch (error) {
    console.error('Error fetching player:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch player details'
    });
  }
});

// POST /api/players - Create a new player (protected)
router.post('/', authenticate, authorize(['ORGANIZER', 'OFFICER', 'ADMIN']), async (req, res) => {
  try {
    const { 
      first_name, 
      last_name, 
      gender, 
      email,
      phone,
      birth_date, 
      state_id, 
      city_id 
    } = req.body;
    
    // Validate required fields
    if (!first_name || !last_name) {
      return res.status(400).json({
        status: 'error',
        message: 'First name and last name are required'
      });
    }
    
    // Create player in a transaction
    const { data, error } = await supabaseAdmin
      .from('players')
      .insert([
        { 
          first_name, 
          last_name, 
          gender, 
          email,
          phone,
          birth_date, 
          state_id, 
          city_id 
        }
      ])
      .select()
      .single();
    
    if (error) throw error;
    
    // Initialize ratings with default values
    const formats = ['CLASSICAL', 'RAPID', 'BLITZ'];
    const ratingInserts = formats.map(format => ({
      player_id: data.id,
      format,
      rating: 1200,
      games_played: 0,
      is_established: false,
      bonus_applied: false
    }));
    
    const { error: ratingError } = await supabaseAdmin
      .from('ratings')
      .insert(ratingInserts);
    
    if (ratingError) throw ratingError;
    
    return res.status(201).json({
      status: 'success',
      message: 'Player created successfully',
      data
    });
  } catch (error) {
    console.error('Error creating player:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to create player'
    });
  }
});

module.exports = router;
