<?php

// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Moodle is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Moodle.  If not, see <http://www.gnu.org/licenses/>.

/**
 * Aggregates the grades for submission and grades for assessments and calculates the total grade for workshop
 *
 * @package   mod-workshop
 * @copyright 2009 David Mudrak <david.mudrak@gmail.com>
 * @license   http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

require_once(dirname(dirname(dirname(__FILE__))).'/config.php');
require_once(dirname(__FILE__).'/locallib.php');

$cmid       = required_param('cmid', PARAM_INT);            // course module
$confirm    = optional_param('confirm', false, PARAM_BOOL); // confirmation

$cm         = get_coursemodule_from_id('workshop', $cmid, 0, false, MUST_EXIST);
$course     = $DB->get_record('course', array('id' => $cm->course), '*', MUST_EXIST);
$workshop   = $DB->get_record('workshop', array('id' => $cm->instance), '*', MUST_EXIST);
$workshop   = new workshop($workshop, $cm, $course);

$PAGE->set_url(new moodle_url($workshop->aggregate_url(), array('cmid' => $cmid)));

require_login($course, false, $cm);
require_capability('mod/workshop:overridegrades', $PAGE->context);

// load the grading evaluator
$evaluator = $workshop->grading_evaluation_instance();

if ($confirm) {
    if (!confirm_sesskey()) {
        throw new moodle_exception('confirmsesskeybad');
    }
    $workshop->aggregate_submission_grades();   // updates 'grade' in {workshop_submissions}
    $evaluator->update_grading_grades();        // updates 'gradinggrade' in {workshop_assessments}
    $workshop->aggregate_grading_grades();      // updates 'gradinggrade' in {workshop_aggregations}
    $workshop->aggregate_total_grades();        // updates 'totalgrade' in {workshop_aggregations}
    redirect($workshop->view_url());
}

$PAGE->set_title($workshop->name);
$PAGE->set_heading($course->fullname);
$PAGE->navbar->add(get_string('aggregation', 'workshop'));

//
// Output starts here
//
echo $OUTPUT->header();
echo $OUTPUT->confirm(get_string('aggregationinfo', 'workshop'),
                        new moodle_url($PAGE->url, array('confirm' => 1)), $workshop->view_url());
echo $OUTPUT->footer();