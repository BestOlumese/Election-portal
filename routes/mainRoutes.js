const express = require('express');
const router = express.Router();
const electionController = require('../controllers/electionController');

router.get('/', electionController.getHomePage);
router.get('/polling-unit', electionController.getPollingUnitResult);
router.get('/lga-total', electionController.getLgaTotal);
router.get('/new-result', electionController.getNewResultForm);
router.post('/new-result', electionController.postNewResult);

module.exports = router;