import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface VehicleRulesProps {
  data: any;
  onChange: (field: string, value: any) => void;
}

export function VehicleRules({ data, onChange }: VehicleRulesProps) {
  const ruleOptions = [
    { id: 'no_smoking', label: 'No fumar' },
    { id: 'no_pets', label: 'No mascotas' },
    { id: 'no_food', label: 'No comer en el vehículo' },
    { id: 'return_full_tank', label: 'Devolver con tanque lleno' },
    { id: 'clean_interior', label: 'Devolver limpio por dentro' },
    { id: 'clean_exterior', label: 'Devolver limpio por fuera' },
  ];

  const currentRules = data.rules || {};

  const toggleRule = (ruleId: string) => {
    onChange('rules', {
      ...currentRules,
      [ruleId]: !currentRules[ruleId]
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h4 className="font-medium mb-3">Reglas de uso</h4>
        <p className="text-sm text-muted-foreground mb-4">
          Selecciona las reglas que los arrendatarios deben seguir
        </p>
        <div className="space-y-3">
          {ruleOptions.map((rule) => (
            <div key={rule.id} className="flex items-center space-x-2">
              <Checkbox
                id={rule.id}
                checked={currentRules[rule.id] || false}
                onCheckedChange={() => toggleRule(rule.id)}
              />
              <label
                htmlFor={rule.id}
                className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                {rule.label}
              </label>
            </div>
          ))}
        </div>
      </div>

      <div>
        <Label htmlFor="custom_rules">Reglas adicionales (opcional)</Label>
        <Textarea
          id="custom_rules"
          value={currentRules.custom_rules || ''}
          onChange={(e) => onChange('rules', { ...currentRules, custom_rules: e.target.value })}
          placeholder="Añade cualquier regla adicional que consideres importante..."
          rows={4}
        />
      </div>

      <div className="bg-muted p-4 rounded-lg">
        <h4 className="font-medium mb-2">Información importante</h4>
        <ul className="text-sm space-y-1 text-muted-foreground list-disc list-inside">
          <li>Las reglas deben ser razonables y legales</li>
          <li>Serán mostradas al arrendatario antes de reservar</li>
          <li>El incumplimiento puede resultar en cargos adicionales</li>
        </ul>
      </div>
    </div>
  );
}