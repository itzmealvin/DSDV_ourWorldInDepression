import sys
import unittest
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'tooling'))
from prepare_data import aggregate_survey, merge_country_data

class DataTests(unittest.TestCase):
    def test_join_keeps_country_and_year_together(self):
        rows = merge_country_data([
            {'Entity': 'Vietnam', 'Code': 'VNM', 'Year': '1990', 'Depression': '3.2'},
            {'Entity': 'Vietnam', 'Code': 'VNM', 'Year': '2017', 'Depression': '2.9'}
        ], [{'Code': 'VNM', 'Year': '2017', 'Population': '96000000', 'Male': '2.1'}], [], [])
        self.assertEqual(len(rows), 2)
        self.assertIsNone(rows[0]['male'])
        self.assertEqual(rows[1]['male'], 2.1)
        self.assertEqual(rows[1]['population'], 96000000)
        self.assertEqual(rows[0]['depression'], 3.2)

    def test_world_aggregate_is_not_counted_as_a_country(self):
        rows = merge_country_data([
            {'Entity': 'Vietnam', 'Code': 'VNM', 'Year': '2017', 'Depression': '2.9'},
            {'Entity': 'World', 'Code': 'OWID_WRL', 'Year': '2017', 'Depression': '3.4'}
        ], [], [], [])
        self.assertEqual([row['code'] for row in rows], ['VNM'])

    def test_frequency_translates_actual_source_categories(self):
        source = ['Một - hai lần', 'Khoảng năm lần', 'Khoảng 5 lần', 'Khoảng 10 lần', 'Mỗi ngày']
        rows = [{'Bạn từng nghĩ tới việc t.ự s.á.t bao nhiêu lần?': label} for label in source]
        self.assertEqual(aggregate_survey(rows)['frequency'], [
            {'label': 'Once or twice', 'count': 1}, {'label': 'Around five times', 'count': 2},
            {'label': 'Around ten times', 'count': 1}, {'label': 'Every day', 'count': 1}
        ])

    def test_aggregate_excludes_participant_identifiers(self):
        result = aggregate_survey([
            {'Name': 'Private Person', 'Birthday': '1/1/2000', 'Mức độ': 'Nhẹ'},
            {'Mức độ': 'Nặng'}, {'Mức độ': ''}
        ])
        self.assertEqual(result['total'], 3)
        self.assertEqual(result['levels'], [{'label': 'Minor', 'count': 1}, {'label': 'Severe', 'count': 1}, {'label': 'Unclassified', 'count': 1}])
        self.assertNotIn('Private Person', str(result))
        self.assertEqual(sum(x['count'] for x in result['frequency']), 3)

if __name__ == '__main__': unittest.main()
