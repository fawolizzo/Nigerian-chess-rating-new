const express = require('express');
const router = express.Router();
const { supabaseAdmin } = require('../lib/supabase');
const { authenticate, authorize } = require('../middleware/auth'); // You'll need to create this middleware

// GET /api/players - List/search players (public)
router.get('/', async (req, res) => {
  try {
    const { name, state, format, minRating, maxRating, limit = 20, page = 1 } = req.query;
    
    // Start query builder
    let query = supabaseAdmin.from('players').select(`
      *,
      state:states(id, name),
      city:cities(id, name),
      ratings(format, rating, is_established),
      titles:player_titles(title_code, verified, title:titles(code, name))
    `);
    
    // Apply filters
    if (name) {
      query = query.or(`first_name.ilike.%${name}%,last_name.ilike.%${name}%`);
    }
    
    if (state) {
      query = query.eq('state_id', state);
    }
    
    // Handle pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    
    query = query.range(from, to);
    
    const { data, error, count } = await query;
    
    if (error) throw error;
    
    // Additional filtering for ratings (can't do easily in the query)
    let filteredPlayers = data;
    if (format || minRating || maxRating) {
      filteredPlayers = data.filter(player => {
        const playerRating = player.ratings.find(r => !format || r.format === format);
        if (!playerRating) return false;
        if (minRating && playerRating.rating < parseInt(minRating)) return false;
        if (maxRating && playerRating.rating > parseInt(maxRating)) return false;
        return true;
      });
    }
    
    res.json({
      status: 'success',
      data: filteredPlayers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count
      }
    });
  } catch (error) {
    console.error('Error fetching players:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch players'
    });
  }
});

// GET /api/players/:id - Get player details (public)
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const { data, error } = await supabaseAdmin
      .from('players')
      .select(`
        *,
        state:states(id, name),
        city:cities(id, name),
        ratings(format, rating, games_played, is_established, bonus_applied),
        titles:player_titles(title_code, verified, title:titles(code, name)),
        rating_history(id, format, old_rating, new_rating, rating_change, processed_at, tournament:tournaments(id, name))
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
    
    res.json({
      status: 'success',
      data
    });
  } catch (error) {
    console.error('Error fetching player:', error);
    res.status(500).json({
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
      birth_date, 
      email,
      phone,
      state_id, 
      city_id, 
      fide_id 
    } = req.body;
    
    // Validate required fields
    if (!first_name || !last_name) {
      return res.status(400).json({
        status: 'error',
        message: 'First name and last name are required'
      });
    }
    
    // Create the player
    const { data, error } = await supabaseAdmin
      .from('players')
      .insert([
        { 
          first_name, 
          last_name, 
          gender, 
          birth_date, 
          email,
          phone,
          state_id, 
          city_id, 
          fide_id 
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
      rating: 1200, // Default starting rating
      games_played: 0,
      is_established: false,
      bonus_applied: false
    }));
    
    const { error: ratingError } = await supabaseAdmin
      .from('ratings')
      .insert(ratingInserts);
    
    if (ratingError) throw ratingError;
    
    res.status(201).json({
      status: 'success',
      message: 'Player created successfully',
      data
    });
  } catch (error) {
    console.error('Error creating player:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create player'
    });
  }
});

// Export the router
module.exports = router;
