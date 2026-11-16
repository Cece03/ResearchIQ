from pathlib import Path
import sys
import pandas as pd
from flask import Blueprint, jsonify, request

PROJECT_ROOT = Path(__file__).resolve().parents[2]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))
from algorithms.merge_sort import merge_sort

dashboard_bp = Blueprint('dashboard', __name__)
DATASET_PATH = Path(__file__).resolve().parents[1] / 'datasets' / 'dataset_fusion.csv'

def load_data():
    return pd.read_csv(DATASET_PATH, low_memory=False)

def apply_filters(df):
    source = request.args.get('source', '').strip()
    year = request.args.get('year', '').strip()
    if source and source != 'All':
        df = df[df['source'].fillna('').astype(str).str.split('|', regex=False).apply(lambda items: source in [s.strip() for s in items])]
    if year and year != 'All':
        df = df[pd.to_numeric(df['year'], errors='coerce').eq(int(year))]
    return df

@dashboard_bp.route('/api/dashboard/overview', methods=['GET'])
def dashboard_overview():
    try:
        full = load_data()
        df = apply_filters(full)
        missing = df.isna() | df.astype(str).apply(lambda col: col.str.strip().eq(''))
        source_series = df['source'].dropna().astype(str).str.split('|', regex=False).explode().str.strip()
        sources = source_series[source_series.ne('')].value_counts()
        years = pd.to_numeric(df['year'], errors='coerce').dropna().astype(int).value_counts().sort_index()
        all_sources = full['source'].dropna().astype(str).str.split('|', regex=False).explode().str.strip()
        all_years = pd.to_numeric(full['year'], errors='coerce').dropna().astype(int)
        return jsonify(success=True, total_records=int(len(df)), total_columns=int(len(df.columns)),
                       duplicate_records=int(df.duplicated().sum()), missing_values=int(missing.sum().sum()),
                       missing_by_column={k:int(v) for k,v in missing.sum().sort_values(ascending=False).items()},
                       source_distribution={k:int(v) for k,v in sources.items()},
                       publication_trends={str(k):int(v) for k,v in years.items()},
                       filters={'sources':sorted(set(s for s in all_sources if s)),
                                'years':sorted(set(map(int, all_years)), reverse=True)},
                       filtered_records=int(len(df)), dataset_records=int(len(full)))
    except Exception as exc:
        return jsonify(success=False, error=str(exc)), 500

@dashboard_bp.route('/api/dashboard/records', methods=['GET'])
def dashboard_records():
    try:
        df = apply_filters(load_data())
        search = request.args.get('search', '').strip()
        page = max(request.args.get('page', 1, type=int), 1)
        page_size = min(max(request.args.get('page_size', 10, type=int), 1), 100)
        if search:
            df = df[df.fillna('').astype(str).apply(lambda col: col.str.contains(search, case=False, regex=False)).any(axis=1)]
        sort_by = request.args.get('sort_by', '')
        direction = request.args.get('sort_direction', 'asc')
        if sort_by in df.columns:
            if sort_by == 'year':
                years = pd.to_numeric(df['year'], errors='coerce')
                pairs = [(int(v), pos) for pos, v in enumerate(years) if pd.notna(v)]
                ordered = merge_sort(pairs)
                if direction == 'desc':
                    ordered.reverse()
                null_positions = [pos for pos, v in enumerate(years) if pd.isna(v)]
                df = df.iloc[[pos for _, pos in ordered] + null_positions]
            elif sort_by == 'citations':
                numeric = pd.to_numeric(df[sort_by], errors='coerce')
                df = df.assign(_sort=numeric).sort_values('_sort', ascending=direction!='desc', na_position='last', kind='stable').drop(columns='_sort')
            else:
                df = df.assign(_sort=df[sort_by].fillna('').astype(str).str.casefold()).sort_values('_sort', ascending=direction!='desc', kind='stable').drop(columns='_sort')
        total = len(df)
        records = df.iloc[(page-1)*page_size:page*page_size].astype(object).where(lambda f:pd.notna(f), None).to_dict(orient='records')
        return jsonify(success=True, records=records, columns=df.columns.tolist(), total=int(total), page=page,
                       page_size=page_size, total_pages=max(1, (total+page_size-1)//page_size))
    except Exception as exc:
        return jsonify(success=False, error=str(exc)), 500

@dashboard_bp.route('/api/dashboard/merge-sort', methods=['GET'])
def dashboard_merge_sort():
    try:
        years = pd.to_numeric(load_data()['year'], errors='coerce').dropna().astype(int).tolist()
        result = merge_sort(years)
        return jsonify(success=True, algorithm='Merge Sort', field='year', total_records=len(years),
                       original_years=years, sorted_years=result, sorting_successful=result==sorted(years),
                       time_complexity='O(n log n)', space_complexity='O(n)')
    except Exception as exc:
        return jsonify(success=False, error=str(exc)), 500
