"""Optional maintenance tool; the checked-in public/ site needs no build."""
import csv
import json
import math
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TOPICS = ['education', 'family', 'love', 'self', 'work']
LEVELS = {'Bình thường': 'Normal', 'Tối thiểu': 'Minimal', 'Nhẹ': 'Minor', 'Trung bình': 'Moderate', 'Nặng': 'Severe'}

def number(value):
    try:
        parsed = float(value)
        return parsed if math.isfinite(parsed) else None
    except (ValueError, TypeError):
        return None

def merge_country_data(world, population, ages, suicide):
    key = lambda row: (row['Code'], row['Year'])
    indexes = [{key(row): row for row in source} for source in [population, ages, suicide]]
    result = []
    fields = {'depression':'Depression', 'anxiety':'AnxietyDisorders', 'bipolar':'Bipolar Disorder ', 'schizophrenia':'Schizophrenia', 'eating':'Eating Disorders', 'drug':'Drug se Disorders ', 'alcohol':'Alcohol use Disorders'}
    for row in world:
        if row['Code'] == 'OWID_WRL':
            continue
        p, a, s = [index.get(key(row), {}) for index in indexes]
        item = {'name':row['Entity'], 'code':row['Code'], 'year':int(row['Year'])}
        item.update({name:number(row.get(source)) for name,source in fields.items()})
        item.update({'population':number(p.get('Population')), 'male':number(p.get('Male')), 'female':number(p.get('Female')), 'age':number(a.get('70+')), 'age15':number(a.get('15-19')), 'age20':number(a.get('20-24 ')), 'age30':number(a.get('30-34')), 'suicide':number(s.get('SuicideRate'))})
        result.append(item)
    return result

def aggregate_survey(rows):
    levels = Counter(LEVELS.get(row.get('Mức độ'), 'Unclassified') for row in rows)
    frequency_labels = {'Chưa từng':'Never', 'Một - hai lần':'Once or twice', 'Khoảng năm lần':'Around five times', 'Khoảng 5 lần':'Around five times', 'Khoảng 10 lần':'Around ten times', 'Rất nhiều':'Many times', 'Mỗi ngày':'Every day'}
    frequencies = Counter(frequency_labels.get(row.get('Bạn từng nghĩ tới việc t.ự s.á.t bao nhiêu lần?'), 'Other / unrecorded') for row in rows)
    return {'total':len(rows), 'levels':[{'label':label,'count':levels[label]} for label in [*LEVELS.values(),'Unclassified'] if levels[label]], 'frequency':[{'label':label,'count':frequencies[label]} for label in dict.fromkeys([*frequency_labels.values(),'Other / unrecorded']) if frequencies[label]]}

def read_csv(relative):
    with (ROOT / relative).open(encoding='utf-8-sig', newline='') as handle:
        return list(csv.DictReader(handle))

def main():
    target = ROOT / 'public' / 'data'
    target.mkdir(parents=True, exist_ok=True)
    countries = merge_country_data(*[read_csv(f'data/{name}.csv') for name in ['world_data','population_data','age_range_data','suicide_rate_data']])
    survey = {topic:aggregate_survey(read_csv(f'assets/{topic}/{topic}.csv')) for topic in TOPICS}
    demographics = {}
    for name, column in [('Sex','Sex'),('Academic Level','AcademicLevel'),('LGBT','LGBT')]:
        counts = Counter(row[column] for row in read_csv(f'assets/{name}.csv'))
        demographics[name] = [{'label':label,'count':count} for label,count in counts.items()]
    for name,payload in [('countries.json',countries),('survey.json',{'topics':survey,'demographics':demographics})]:
        (target / name).write_text(json.dumps(payload, ensure_ascii=False, separators=(',',':'), allow_nan=False), encoding='utf-8')
    (target / 'world.geojson').write_bytes((ROOT / 'data' / 'world.geojson').read_bytes())
    print(f'Prepared {len(countries)} country-year records and {sum(item["total"] for item in survey.values())} anonymous survey counts in public/data/.')

if __name__ == '__main__': main()
