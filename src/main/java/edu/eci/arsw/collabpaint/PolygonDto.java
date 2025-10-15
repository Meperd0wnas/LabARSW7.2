package edu.eci.arsw.collabpaint;

import java.util.List;

import edu.eci.arsw.collabpaint.model.Point;

// DTO para enviar polígonos 
    public class PolygonDto {
        private List<Point> points;
        private String timestamp;

        public PolygonDto() {}

        public PolygonDto(List<Point> points, String timestamp) {
            this.points = points;
            this.timestamp = timestamp;
        }

        public List<Point> getPoints() { return points; }
        public void setPoints(List<Point> points) { this.points = points; }

        public String getTimestamp() { return timestamp; }
        public void setTimestamp(String timestamp) { this.timestamp = timestamp; }

        @Override
        public String toString() {
            return "PolygonDto{" + "points=" + points + ", timestamp=" + timestamp + '}';
        }
    }

