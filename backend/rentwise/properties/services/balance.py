from decimal import Decimal

def recompute_tenancy_balance(tenancy, save=True):
    new_balance = tenancy.calculate_balance()
    if save and tenancy.balance != new_balance:
        tenancy.balance = new_balance
        tenancy.save(update_fields=["balance"])
    return new_balance