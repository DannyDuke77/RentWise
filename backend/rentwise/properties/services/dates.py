from datetime import date

def first_day_of_month(d):
    return date(d.year, d.month, 1)

def next_month(d):
    if d.month == 12:
        return date(d.year + 1, 1, 1)
    return date(d.year, d.month + 1, 1)