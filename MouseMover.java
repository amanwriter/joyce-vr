import java.awt.MouseInfo;
import java.awt.Point;
import java.awt.Robot;
import java.io.BufferedReader;
import java.io.InputStreamReader;

public class MouseMover {

    public static void main(String[] args) throws Exception {
        Robot robot = new Robot();
        BufferedReader bufferedReader = new BufferedReader(new InputStreamReader(System.in));
        String line;
        while ((line = bufferedReader.readLine()) != null) {
            String[] args1 = line.split(" ");
            Point p = MouseInfo.getPointerInfo().getLocation();
            robot.mouseMove(p.x + Integer.parseInt(args1[0]), p.y + Integer.parseInt(args1[1]));
        }
    }
}
