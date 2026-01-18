const db = require('../config/db');

exports.getHomePage = (req, res) => {
    res.render('index');
};

exports.getPollingUnitResult = async (req, res) => {
    try {
        const [pollingUnits] = await db.execute('SELECT uniqueid, polling_unit_name FROM polling_unit WHERE polling_unit_name IS NOT NULL LIMIT 200');
        
        let results = [];
        let selectedUnit = null;

        if (req.query.unit_id) {
            const [rows] = await db.execute(
                'SELECT * FROM announced_pu_results WHERE polling_unit_uniqueid = ?', 
                [req.query.unit_id]
            );
            results = rows;
            
            const [unitName] = await db.execute(
                'SELECT polling_unit_name FROM polling_unit WHERE uniqueid = ?',
                [req.query.unit_id]
            );
            if (unitName.length > 0) selectedUnit = unitName[0].polling_unit_name;
        }

        res.render('question1', { pollingUnits, results, selectedUnit });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

exports.getLgaTotal = async (req, res) => {
    try {
        const [lgas] = await db.execute('SELECT lga_id, lga_name FROM lga');
        
        let totalResults = [];
        let selectedLga = null;

        if (req.query.lga_id) {
            const query = `
                SELECT p.party_abbreviation, SUM(p.party_score) as total_score
                FROM announced_pu_results p
                JOIN polling_unit pu ON p.polling_unit_uniqueid = pu.uniqueid
                WHERE pu.lga_id = ?
                GROUP BY p.party_abbreviation
            `;
            
            const [rows] = await db.execute(query, [req.query.lga_id]);
            totalResults = rows;
            
            const [lgaName] = await db.execute('SELECT lga_name FROM lga WHERE lga_id = ?', [req.query.lga_id]);
            if (lgaName.length > 0) selectedLga = lgaName[0].lga_name;
        }

        res.render('question2', { lgas, totalResults, selectedLga });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

exports.getNewResultForm = async (req, res) => {
    try {
        const [parties] = await db.execute('SELECT DISTINCT partyid FROM party');
        const [pollingUnits] = await db.execute('SELECT uniqueid, polling_unit_name FROM polling_unit');
        res.render('question3', { parties, pollingUnits, message: null });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

exports.postNewResult = async (req, res) => {
    const { polling_unit_id, results } = req.body;
    
    try {
        const queries = [];
        const partyKeys = Object.keys(results);

        for (let party of partyKeys) {
            const score = results[party];
            if (score && score !== '') {
                queries.push(
                    db.execute(
                        'INSERT INTO announced_pu_results (polling_unit_uniqueid, party_abbreviation, party_score, entered_by_user, date_entered, user_ip_address) VALUES (?, ?, ?, ?, NOW(), ?)',
                        [polling_unit_id, party, score, 'Admin', '127.0.0.1']
                    )
                );
            }
        }

        await Promise.all(queries);
        
        const [parties] = await db.execute('SELECT DISTINCT partyid FROM party');
        const [pollingUnits] = await db.execute('SELECT uniqueid, polling_unit_name FROM polling_unit');
        
        res.render('question3', { parties, pollingUnits, message: 'Results added successfully!' });

    } catch (err) {
        console.error(err);
        res.status(500).send('Error saving results');
    }
};