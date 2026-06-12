from flask import Flask, render_template, request, jsonify
import serial
import time
import threading

app = Flask(__name__)

# Configurer le port série pour l'Arduino Mega de Léa
SERIAL_PORT = '/dev/ttyACM0' 
BAUD_RATE = 9600

try:
    arduino = serial.Serial(SERIAL_PORT, BAUD_RATE, timeout=1)
    time.sleep(2) # Laisse le temps à l'Arduino de rebooter
    print("✅ Connexion établie avec l'Arduino Mega de Léa !")
except Exception as e:
    print(f"⚠️ Impossible de se connecter à l'Arduino sur {SERIAL_PORT}.")
    print("👉 Mode SIMULATION activé (les commandes s'afficheront juste dans le terminal).")
    arduino = None

def lire_retours_arduino():
    """Boucle de lecture en tâche de fond pour afficher ce que le robot raconte"""
    while arduino and arduino.is_open:
        try:
            if arduino.in_available() > 0:
                ligne = arduino.readline().decode('utf-8').strip()
                if ligne:
                    print(f"🤖 [Arduino] -> {ligne}")
        except Exception:
            break
        time.sleep(0.1)

# Lancer la lecture de l'Arduino en tâche de fond (Thread)
if arduino:
    t = threading.Thread(target=lire_retours_arduino, daemon=True)
    t.start()

@app.route('/')
def index():
    """Affiche l'application web de Ninon"""
    return render_template('index.html')

@app.route('/command', methods=['POST'])
def envoyer_commande():
    """Route API qui reçoit les ordres de l'interface graphique de Ninon"""
    data = request.json
    commande = data.get('command', '').strip() # 'command' correspond à ce que Ninon envoie en JS
    
    if not commande:
        return jsonify({"status": "error", "message": "Aucune commande reçue"}), 400
        
    print(f"📡 [Web App] -> Requête reçue : {commande}")
    
    if arduino:
        # Léa lit les commandes se terminant par une nouvelle ligne (\n)
        format_commande = f"{commande}\n"
        arduino.write(format_commande.encode('utf-8'))
        return jsonify({
            "status": "success", 
            "message": f"Commande '{commande}' transmise à l'automate."
        })
    else:
        return jsonify({
            "status": "simulation", 
            "message": f"[SIMU] Commande '{commande}' exécutée virtuellement."
        })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)